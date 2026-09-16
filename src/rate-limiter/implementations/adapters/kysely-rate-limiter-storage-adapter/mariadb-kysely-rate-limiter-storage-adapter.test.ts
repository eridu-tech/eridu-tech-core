import { MariaDbContainer } from "@testcontainers/mariadb";
import { Kysely, MysqlDialect } from "kysely";
import { createPool } from "mysql2";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { contextToken } from "@/execution-context/contracts/_module.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import { KyselyRateLimiterStorageAdapter } from "@/rate-limiter/implementations/adapters/kysely-rate-limiter-storage-adapter/_module.js";
import { rateLimiterStorageAdapterTestSuite } from "@/rate-limiter/implementations/test-utilities/_module.js";
import { SuperJsonSerdeAdapter } from "@/serde/implementations/adapters/_module.js";
import { Serde } from "@/serde/implementations/derivables/serde.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { KyselyTransactionAdapter } from "@/transaction-context/implementations/adapters/kysely-transaction-adapter/_module.js";
import { TransactionContext } from "@/transaction-context/implementations/derivables/_module.js";

import type { StartedMariaDbContainer } from "@testcontainers/mariadb";
import type { ColumnMetadata, TableMetadata } from "kysely";
import type { Pool } from "mysql2";

import type { KyselyRateLimiterStorageTables } from "@/rate-limiter/implementations/adapters/kysely-rate-limiter-storage-adapter/_module.js";
import type { ITransactionContext } from "@/transaction-context/contracts/_module.js";

const timeout = TimeSpan.fromMinutes(2);
describe("mariadb class: KyselyRateLimiterStorageAdapter", () => {
    let database: Pool;
    let container: StartedMariaDbContainer;

    beforeEach(async () => {
        container = await new MariaDbContainer("mariadb:10.11").start();
        database = createPool({
            host: container.getHost(),
            port: container.getPort(),
            database: container.getDatabase(),
            user: container.getUsername(),
            password: container.getUserPassword(),
            connectionLimit: 10,
        });
    }, timeout.toMilliseconds());
    afterEach(async () => {
        await new Promise<void>((resolve, reject) => {
            database.end((error) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve();
            });
        });
        await container.stop();
    }, timeout.toMilliseconds());
    function createTrxCtx(
        database_: Pool,
    ): ITransactionContext<Kysely<KyselyRateLimiterStorageTables>> {
        return new TransactionContext({
            token: contextToken("kysely"),
            executionContext: new ExecutionContext(
                new AlsExecutionContextAdapter(),
            ),
            adapter: new KyselyTransactionAdapter({
                database: new Kysely({
                    dialect: new MysqlDialect({
                        pool: database_,
                    }),
                }),
            }),
        });
    }

    rateLimiterStorageAdapterTestSuite({
        createAdapter: async () => {
            const adapter = new KyselyRateLimiterStorageAdapter({
                transactionContext: createTrxCtx(database),
                serde: new Serde(new SuperJsonSerdeAdapter()),
            });
            await adapter.init();
            return adapter;
        },
        test,
        beforeEach,
        expect,
        describe,
    });
    describe("method: removeAllExpired", () => {
        test("Should remove all expired keys", async () => {
            const trxCtx = createTrxCtx(database);
            const adapter = new KyselyRateLimiterStorageAdapter({
                transactionContext: trxCtx,
                serde: new Serde(new SuperJsonSerdeAdapter()),
            });
            await adapter.init();

            await trxCtx.client
                .insertInto("rateLimiter")
                .values({
                    key: "a",
                    state: "state",
                    expiration: Date.now() - 1000,
                })
                .execute();
            await trxCtx.client
                .insertInto("rateLimiter")
                .values({
                    key: "b",
                    state: "state",
                    expiration: Date.now() - 1000,
                })
                .execute();
            await trxCtx.client
                .insertInto("rateLimiter")
                .values({
                    key: "c",
                    state: "state",
                    expiration: Date.now() + 50000,
                })
                .execute();

            await adapter.removeAllExpired();

            expect(
                await trxCtx.client
                    .selectFrom("rateLimiter")
                    .where("rateLimiter.key", "=", "a")
                    .selectAll()
                    .executeTakeFirst(),
            ).toBeUndefined();
            expect(
                await trxCtx.client
                    .selectFrom("rateLimiter")
                    .where("rateLimiter.key", "=", "b")
                    .selectAll()
                    .executeTakeFirst(),
            ).toBeUndefined();
            expect(
                await trxCtx.client
                    .selectFrom("rateLimiter")
                    .where("rateLimiter.key", "=", "c")
                    .selectAll()
                    .executeTakeFirst(),
            ).toBeDefined();
        });
    });
    describe("method: init", () => {
        test("Should create rateLimiter table", async () => {
            const trxCtx = createTrxCtx(database);
            const adapter = new KyselyRateLimiterStorageAdapter({
                transactionContext: trxCtx,
                serde: new Serde(new SuperJsonSerdeAdapter()),
            });
            await adapter.init();

            const tables = await trxCtx.client.introspection.getTables();

            expect(tables).toContainEqual(
                expect.objectContaining<Partial<TableMetadata>>({
                    name: "rateLimiter",
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument
                    columns: expect.arrayContaining<Partial<ColumnMetadata>>([
                        expect.objectContaining<Partial<ColumnMetadata>>({
                            name: "key",
                            dataType: "varchar",
                            isNullable: false,
                            hasDefaultValue: false,
                        }),
                        expect.objectContaining<Partial<ColumnMetadata>>({
                            name: "state",
                            dataType: "varchar",
                            isNullable: false,
                            hasDefaultValue: false,
                        }),
                        expect.objectContaining<Partial<ColumnMetadata>>({
                            name: "expiration",
                            dataType: "bigint",
                            isNullable: true,
                            // MariaDB reports the implicit `NULL` default of a nullable
                            // column as the literal string `'NULL'`, which Kysely's
                            // `MysqlIntrospector` reads as `hasDefaultValue: true`.
                            hasDefaultValue: true,
                        }),
                    ]),
                }),
            );
        });
        test("Should not throw error when called multiple times", async () => {
            const adapter = new KyselyRateLimiterStorageAdapter({
                transactionContext: createTrxCtx(database),
                serde: new Serde(new SuperJsonSerdeAdapter()),
            });
            await adapter.init();

            const promise = adapter.init();

            await expect(promise).resolves.toBeUndefined();
        });
    });
    describe("method: deInit", () => {
        test("Should remove rateLimiter table", async () => {
            const trxCtx = createTrxCtx(database);
            const adapter = new KyselyRateLimiterStorageAdapter({
                transactionContext: trxCtx,
                serde: new Serde(new SuperJsonSerdeAdapter()),
            });
            await adapter.init();
            await adapter.deInit();

            const tables = await trxCtx.client.introspection.getTables();

            expect(tables).not.toContainEqual(
                expect.objectContaining<Partial<TableMetadata>>({
                    name: "rate-limiter",
                }),
            );
        });
        test("Should not throw error when called multiple times", async () => {
            const adapter = new KyselyRateLimiterStorageAdapter({
                transactionContext: createTrxCtx(database),
                serde: new Serde(new SuperJsonSerdeAdapter()),
            });
            await adapter.init();
            await adapter.deInit();

            const promise = adapter.deInit();

            await expect(promise).resolves.toBeUndefined();
        });
        test("Should not throw error when called before init", async () => {
            const adapter = new KyselyRateLimiterStorageAdapter({
                transactionContext: createTrxCtx(database),
                serde: new Serde(new SuperJsonSerdeAdapter()),
            });

            const promise = adapter.deInit();

            await expect(promise).resolves.toBeUndefined();
        });
    });
    describe("Transaction tests:", () => {
        test("Should not persist changes when the transaction fails", async () => {
            const trxCtx = createTrxCtx(database);
            const adapter = new KyselyRateLimiterStorageAdapter({
                transactionContext: trxCtx,
                serde: new Serde(new SuperJsonSerdeAdapter()),
            });
            await adapter.init();

            try {
                await trxCtx.run(async () => {
                    await adapter.transaction(async (trx) => {
                        await trx.upsert("a", 1, new Date());
                        await trx.upsert("b", 1, new Date());
                    });
                    throw new Error("Transaction failure");
                });
            } catch {
                /* EMPTY */
            }

            const rows = await trxCtx.client
                .selectFrom("rateLimiter")
                .select("rateLimiter.key")
                .execute();

            expect(rows.length).toBe(0);
        });
        test("Should persist changes when the transaction succeeds", async () => {
            const trxCtx = createTrxCtx(database);
            const adapter = new KyselyRateLimiterStorageAdapter({
                transactionContext: trxCtx,
                serde: new Serde(new SuperJsonSerdeAdapter()),
            });
            await adapter.init();

            await trxCtx.run(async () => {
                await adapter.transaction(async (trx) => {
                    await trx.upsert("a", 1, new Date());
                    await trx.upsert("b", 1, new Date());
                });
            });

            const rows = await trxCtx.client
                .selectFrom("rateLimiter")
                .select("rateLimiter.key")
                .execute();

            expect(rows.length).toBe(2);
        });
    });
});
