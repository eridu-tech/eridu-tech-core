import { MariaDbContainer } from "@testcontainers/mariadb";
import { Kysely, MysqlDialect } from "kysely";
import { createPool } from "mysql2";
import { describe, test, expect, beforeEach, afterEach } from "vitest";

import { KyselyCircuitBreakerStorageAdapter } from "@/circuit-breaker/implementations/adapters/kysely-circuit-breaker-storage-adapter/kysely-circuit-breaker-storage-adapter.js";
import { circuitBreakerStorageAdapterTestSuite } from "@/circuit-breaker/implementations/test-utilities/_module.js";
import { contextToken } from "@/execution-context/contracts/_module.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import { SuperJsonSerdeAdapter } from "@/serde/implementations/adapters/super-json-serde-adapter/_module.js";
import { Serde } from "@/serde/implementations/derivables/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { KyselyTransactionAdapter } from "@/transaction-context/implementations/adapters/kysely-transaction-adapter/_module.js";
import { TransactionContext } from "@/transaction-context/implementations/derivables/_module.js";

import type { StartedMariaDbContainer } from "@testcontainers/mariadb";
import type { ColumnMetadata, TableMetadata } from "kysely";
import type { Pool } from "mysql2";

import type { KyselyCircuitBreakerStorageTables } from "@/circuit-breaker/implementations/adapters/kysely-circuit-breaker-storage-adapter/kysely-circuit-breaker-storage-adapter.js";
import type { ITransactionContext } from "@/transaction-context/contracts/_module.js";

const timeout = TimeSpan.fromMinutes(2);
describe("mariadb class: KyselyCircuitBreakerStorageAdapter", () => {
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
    ): ITransactionContext<Kysely<KyselyCircuitBreakerStorageTables>> {
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

    circuitBreakerStorageAdapterTestSuite({
        createAdapter: async () => {
            const adapter = new KyselyCircuitBreakerStorageAdapter({
                transactionContext: createTrxCtx(database),
                serde: new Serde(new SuperJsonSerdeAdapter()),
            });
            await adapter.init();
            return adapter;
        },
        beforeEach,
        describe,
        test,
        expect,
    });
    describe("method: init", () => {
        test("Should create circuit breaker table", async () => {
            const trxCtx = createTrxCtx(database);
            const adapter = new KyselyCircuitBreakerStorageAdapter({
                transactionContext: trxCtx,
                serde: new Serde(new SuperJsonSerdeAdapter()),
            });
            await adapter.init();

            const tables = await trxCtx.client.introspection.getTables();

            expect(tables).toContainEqual(
                expect.objectContaining<Partial<TableMetadata>>({
                    name: "circuitBreaker",
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
                    ]),
                }),
            );
        });
        test("Should not throw error when called multiple times", async () => {
            const adapter = new KyselyCircuitBreakerStorageAdapter({
                transactionContext: createTrxCtx(database),
                serde: new Serde(new SuperJsonSerdeAdapter()),
            });
            await adapter.init();

            const promise = adapter.init();

            await expect(promise).resolves.toBeUndefined();
        });
    });
    describe("method: deInit", () => {
        test("Should remove circuit breaker table", async () => {
            const trxCtx = createTrxCtx(database);
            const adapter = new KyselyCircuitBreakerStorageAdapter({
                transactionContext: trxCtx,
                serde: new Serde(new SuperJsonSerdeAdapter()),
            });
            await adapter.init();
            await adapter.deInit();

            const tables = await trxCtx.client.introspection.getTables();

            expect(tables).not.toContainEqual(
                expect.objectContaining<Partial<TableMetadata>>({
                    name: "circuitBreaker",
                }),
            );
        });
        test("Should not throw error when called multiple times", async () => {
            const adapter = new KyselyCircuitBreakerStorageAdapter({
                transactionContext: createTrxCtx(database),
                serde: new Serde(new SuperJsonSerdeAdapter()),
            });
            await adapter.init();
            await adapter.deInit();

            const promise = adapter.deInit();

            await expect(promise).resolves.toBeUndefined();
        });
        test("Should not throw error when called before init", async () => {
            const adapter = new KyselyCircuitBreakerStorageAdapter({
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
            const adapter = new KyselyCircuitBreakerStorageAdapter({
                transactionContext: trxCtx,
                serde: new Serde(new SuperJsonSerdeAdapter()),
            });
            await adapter.init();

            try {
                await trxCtx.run(async () => {
                    await adapter.transaction(async (trx) => {
                        await trx.upsert("a", 1);
                        await trx.upsert("b", 1);
                    });
                    throw new Error("Transaction failure");
                });
            } catch {
                /* EMPTY */
            }

            const rows = await trxCtx.client
                .selectFrom("circuitBreaker")
                .select("circuitBreaker.key")
                .execute();

            expect(rows.length).toBe(0);
        });
        test("Should persist changes when the transaction succeeds", async () => {
            const trxCtx = createTrxCtx(database);
            const adapter = new KyselyCircuitBreakerStorageAdapter({
                transactionContext: trxCtx,
                serde: new Serde(new SuperJsonSerdeAdapter()),
            });
            await adapter.init();

            await trxCtx.run(async () => {
                await adapter.transaction(async (trx) => {
                    await trx.upsert("a", 1);
                    await trx.upsert("b", 1);
                });
            });

            const rows = await trxCtx.client
                .selectFrom("circuitBreaker")
                .select("circuitBreaker.key")
                .execute();

            expect(rows.length).toBe(2);
        });
    });
});
