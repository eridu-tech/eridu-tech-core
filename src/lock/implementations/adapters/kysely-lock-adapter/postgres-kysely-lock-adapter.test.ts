import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { contextToken } from "@/execution-context/contracts/_module.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import { KyselyLockAdapter } from "@/lock/implementations/adapters/kysely-lock-adapter/_module.js";
import { lockAdapterTestSuite } from "@/lock/implementations/test-utilities/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { KyselyTransactionAdapter } from "@/transaction-context/implementations/adapters/kysely-transaction-adapter/_module.js";
import { TransactionContext } from "@/transaction-context/implementations/derivables/_module.js";

import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import type { ColumnMetadata, TableMetadata } from "kysely";

import type { KyselyLockTables } from "@/lock/implementations/adapters/kysely-lock-adapter/_module.js";
import type { ITransactionContext } from "@/transaction-context/contracts/_module.js";

const timeout = TimeSpan.fromMinutes(2);
describe("postgres class: KyselyLockAdapter", () => {
    let database: Pool;
    let container: StartedPostgreSqlContainer;

    beforeEach(async () => {
        container = await new PostgreSqlContainer("postgres:17.5").start();
        database = new Pool({
            database: container.getDatabase(),
            host: container.getHost(),
            user: container.getUsername(),
            port: container.getPort(),
            password: container.getPassword(),
            max: 10,
        });
    }, timeout.toMilliseconds());
    afterEach(async () => {
        await database.end();
        await container.stop();
    }, timeout.toMilliseconds());
    function createTrxCtx(
        database_: Pool,
    ): ITransactionContext<Kysely<KyselyLockTables>> {
        return new TransactionContext({
            token: contextToken("kysely"),
            executionContext: new ExecutionContext(
                new AlsExecutionContextAdapter(),
            ),
            adapter: new KyselyTransactionAdapter({
                database: new Kysely({
                    dialect: new PostgresDialect({
                        pool: database_,
                    }),
                }),
            }),
        });
    }

    lockAdapterTestSuite({
        createAdapter: async () => {
            const adapter = new KyselyLockAdapter({
                transactionContext: createTrxCtx(database),
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
            const adapter = new KyselyLockAdapter({
                transactionContext: trxCtx,
            });
            await adapter.init();

            await trxCtx.client
                .insertInto("lock")
                .values({
                    key: "a",
                    owner: "owner",
                    expiration: Date.now() - 1000,
                })
                .execute();
            await trxCtx.client
                .insertInto("lock")
                .values({
                    key: "b",
                    owner: "owner",
                    expiration: Date.now() - 1000,
                })
                .execute();
            await trxCtx.client
                .insertInto("lock")
                .values({
                    key: "c",
                    owner: "owner",
                    expiration: Date.now() + 50000,
                })
                .execute();

            await adapter.removeAllExpired();

            expect(
                await trxCtx.client
                    .selectFrom("lock")
                    .where("lock.key", "=", "a")
                    .selectAll()
                    .executeTakeFirst(),
            ).toBeUndefined();
            expect(
                await trxCtx.client
                    .selectFrom("lock")
                    .where("lock.key", "=", "b")
                    .selectAll()
                    .executeTakeFirst(),
            ).toBeUndefined();
            expect(
                await trxCtx.client
                    .selectFrom("lock")
                    .where("lock.key", "=", "c")
                    .selectAll()
                    .executeTakeFirst(),
            ).toBeDefined();
        });
    });
    describe("method: init", () => {
        test("Should create lock table", async () => {
            const trxCtx = createTrxCtx(database);
            const adapter = new KyselyLockAdapter({
                transactionContext: trxCtx,
            });
            await adapter.init();

            const tables = await trxCtx.client.introspection.getTables();

            expect(tables).toContainEqual(
                expect.objectContaining<Partial<TableMetadata>>({
                    name: "lock",
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument
                    columns: expect.arrayContaining<Partial<ColumnMetadata>>([
                        expect.objectContaining<Partial<ColumnMetadata>>({
                            name: "key",
                            dataType: "varchar",
                            isNullable: false,
                            hasDefaultValue: false,
                        }),
                        expect.objectContaining<Partial<ColumnMetadata>>({
                            name: "owner",
                            dataType: "varchar",
                            isNullable: false,
                            hasDefaultValue: false,
                        }),
                        expect.objectContaining<Partial<ColumnMetadata>>({
                            name: "expiration",
                            dataType: "int8",
                            isNullable: true,
                            hasDefaultValue: false,
                        }),
                    ]),
                }),
            );
        });
        test("Should not throw error when called multiple times", async () => {
            const adapter = new KyselyLockAdapter({
                transactionContext: createTrxCtx(database),
            });
            await adapter.init();

            const promise = adapter.init();

            await expect(promise).resolves.toBeUndefined();
        });
    });
    describe("method: deInit", () => {
        test("Should remove lock table", async () => {
            const trxCtx = createTrxCtx(database);
            const adapter = new KyselyLockAdapter({
                transactionContext: trxCtx,
            });
            await adapter.init();
            await adapter.deInit();

            const tables = await trxCtx.client.introspection.getTables();

            expect(tables).not.toContainEqual(
                expect.objectContaining<Partial<TableMetadata>>({
                    name: "lock",
                }),
            );
        });
        test("Should not throw error when called multiple times", async () => {
            const adapter = new KyselyLockAdapter({
                transactionContext: createTrxCtx(database),
            });
            await adapter.init();
            await adapter.deInit();

            const promise = adapter.deInit();

            await expect(promise).resolves.toBeUndefined();
        });
        test("Should not throw error when called before init", async () => {
            const adapter = new KyselyLockAdapter({
                transactionContext: createTrxCtx(database),
            });

            const promise = adapter.deInit();

            await expect(promise).resolves.toBeUndefined();
        });
    });
    test("Transaction test", async () => {
        const trxCtx = createTrxCtx(database);
        const adapter = new KyselyLockAdapter({
            transactionContext: trxCtx,
        });
        await adapter.init();

        try {
            await trxCtx.run(async () => {
                await adapter.acquire("a", "1", null);
                await adapter.acquire("b", "1", null);
                throw new Error("Transaction failure");
            });
        } catch {
            /* EMPTY */
        }

        const rows = await trxCtx.client
            .selectFrom("lock")
            .select("lock.key")
            .execute();

        expect(rows.length).toBe(0);
    });
});
