/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { MySqlContainer } from "@testcontainers/mysql";
import { Kysely, MysqlDialect } from "kysely";
import { createPool } from "mysql2";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { contextToken } from "@/execution-context/contracts/_module.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import { KyselySemaphoreAdapter } from "@/semaphore/implementations/adapters/kysely-semaphore-adapter/_module.js";
import { semaphoreAdapterTestSuite } from "@/semaphore/implementations/test-utilities/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { KyselyTransactionAdapter } from "@/transaction-context/implementations/adapters/kysely-transaction-adapter/_module.js";
import { TransactionContext } from "@/transaction-context/implementations/derivables/_module.js";

import type { StartedMySqlContainer } from "@testcontainers/mysql";
import type { ColumnMetadata, TableMetadata } from "kysely";
import type { Pool } from "mysql2";

import type { KyselySemaphoreTables } from "@/semaphore/implementations/adapters/kysely-semaphore-adapter/_module.js";
import type { ITransactionContext } from "@/transaction-context/contracts/_module.js";

const timeout = TimeSpan.fromMinutes(2);
describe("mysql class: KyselySemaphoreAdapter", () => {
    let database: Pool;
    let container: StartedMySqlContainer;

    beforeEach(async () => {
        container = await new MySqlContainer("mysql:9.3.0").start();
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
    ): ITransactionContext<Kysely<KyselySemaphoreTables>> {
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

    semaphoreAdapterTestSuite({
        createAdapter: async () => {
            const adapter = new KyselySemaphoreAdapter({
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
            const adapter = new KyselySemaphoreAdapter({
                transactionContext: trxCtx,
            });
            await adapter.init();

            const limit = 3;
            const key1 = "1";
            const key2 = "2";

            await trxCtx.client
                .insertInto("semaphore")
                .values({ key: key1, limit })
                .execute();
            await trxCtx.client
                .insertInto("semaphore")
                .values({ key: key2, limit })
                .execute();

            await trxCtx.client
                .insertInto("semaphoreSlot")
                .values({ key: key1, id: "1", expiration: Date.now() - 1000 })
                .execute();
            await trxCtx.client
                .insertInto("semaphoreSlot")
                .values({ key: key1, id: "2", expiration: Date.now() - 1000 })
                .execute();
            await trxCtx.client
                .insertInto("semaphoreSlot")
                .values({ key: key1, id: "3", expiration: Date.now() - 1000 })
                .execute();

            await trxCtx.client
                .insertInto("semaphoreSlot")
                .values({ key: key2, id: "4", expiration: Date.now() - 1000 })
                .execute();
            await trxCtx.client
                .insertInto("semaphoreSlot")
                .values({ key: key2, id: "5", expiration: Date.now() - 1000 })
                .execute();
            await trxCtx.client
                .insertInto("semaphoreSlot")
                .values({ key: key2, id: "6", expiration: Date.now() - 1000 })
                .execute();

            await adapter.removeAllExpired();

            expect(
                await trxCtx.client
                    .selectFrom("semaphore")
                    .select("semaphore.key")
                    .execute(),
            ).toEqual([]);
        });
    });
    describe("method: init", () => {
        test("Should create semaphore table", async () => {
            const trxCtx = createTrxCtx(database);
            const adapter = new KyselySemaphoreAdapter({
                transactionContext: trxCtx,
            });
            await adapter.init();

            const tables = await trxCtx.client.introspection.getTables();

            expect(tables).toContainEqual(
                expect.objectContaining<Partial<TableMetadata>>({
                    name: "semaphore",
                    columns: expect.arrayContaining<Partial<ColumnMetadata>>([
                        expect.objectContaining<Partial<ColumnMetadata>>({
                            name: "key",
                            dataType: "varchar",
                            isNullable: false,
                            hasDefaultValue: false,
                        }),
                        expect.objectContaining({
                            name: "limit",
                            dataType: "int",
                            isNullable: false,
                            hasDefaultValue: false,
                        }),
                    ]),
                }),
            );
        });
        test("Should create semaphoreSlot table", async () => {
            const trxCtx = createTrxCtx(database);
            const adapter = new KyselySemaphoreAdapter({
                transactionContext: trxCtx,
            });
            await adapter.init();

            const tables = await trxCtx.client.introspection.getTables();

            expect(tables).toContainEqual(
                expect.objectContaining<Partial<TableMetadata>>({
                    name: "semaphoreSlot",
                    columns: expect.arrayContaining<Partial<ColumnMetadata>>([
                        expect.objectContaining<Partial<ColumnMetadata>>({
                            name: "key",
                            dataType: "varchar",
                            isNullable: false,
                            hasDefaultValue: false,
                        }),
                        expect.objectContaining<Partial<ColumnMetadata>>({
                            name: "id",
                            dataType: "varchar",
                            isNullable: false,
                            hasDefaultValue: false,
                        }),
                        expect.objectContaining({
                            name: "expiration",
                            dataType: "bigint",
                            isNullable: true,
                            hasDefaultValue: false,
                        }),
                    ]),
                }),
            );
        });
        test("Should not throw error when called multiple times", async () => {
            const adapter = new KyselySemaphoreAdapter({
                transactionContext: createTrxCtx(database),
            });
            await adapter.init();

            const promise = adapter.init();

            await expect(promise).resolves.toBeUndefined();
        });
    });
    describe("method: deInit", () => {
        test("Should remove semaphore table", async () => {
            const trxCtx = createTrxCtx(database);
            const adapter = new KyselySemaphoreAdapter({
                transactionContext: trxCtx,
            });
            await adapter.init();
            await adapter.deInit();

            const tables = await trxCtx.client.introspection.getTables();

            expect(tables).not.toContainEqual(
                expect.objectContaining<Partial<TableMetadata>>({
                    name: "semaphore",
                }),
            );
        });
        test("Should remove semaphoreSlot table", async () => {
            const trxCtx = createTrxCtx(database);
            const adapter = new KyselySemaphoreAdapter({
                transactionContext: trxCtx,
            });
            await adapter.init();
            await adapter.deInit();

            const tables = await trxCtx.client.introspection.getTables();

            expect(tables).not.toContainEqual(
                expect.objectContaining<Partial<TableMetadata>>({
                    name: "semaphoreSlot",
                }),
            );
        });
        test("Should not throw error when called multiple times", async () => {
            const adapter = new KyselySemaphoreAdapter({
                transactionContext: createTrxCtx(database),
            });
            await adapter.init();
            await adapter.deInit();
            const promise = adapter.deInit();

            await expect(promise).resolves.toBeUndefined();
        });
        test("Should not throw error when called before init", async () => {
            const adapter = new KyselySemaphoreAdapter({
                transactionContext: createTrxCtx(database),
            });
            const promise = adapter.deInit();
            await adapter.init();

            await expect(promise).resolves.toBeUndefined();
        });
    });
    describe("Transaction tests:", () => {
        test("Should not persist changes when the transaction fails", async () => {
            const trxCtx = createTrxCtx(database);
            const adapter = new KyselySemaphoreAdapter({
                transactionContext: trxCtx,
            });
            await adapter.init();

            try {
                await trxCtx.run(async () => {
                    await adapter.acquire({
                        key: "a",
                        slotId: "1",
                        limit: 4,
                        ttl: null,
                    });
                    await adapter.acquire({
                        key: "b",
                        slotId: "1",
                        limit: 4,
                        ttl: null,
                    });
                    throw new Error("Transaction failure");
                });
            } catch {
                /* EMPTY */
            }

            const semaphoreRows = await trxCtx.client
                .selectFrom("semaphore")
                .select("semaphore.key")
                .execute();
            const slotRows = await trxCtx.client
                .selectFrom("semaphoreSlot")
                .select("semaphoreSlot.key")
                .execute();

            expect(semaphoreRows.length).toBe(0);
            expect(slotRows.length).toBe(0);
        });
        test("Should persist changes when the transaction succeeds", async () => {
            const trxCtx = createTrxCtx(database);
            const adapter = new KyselySemaphoreAdapter({
                transactionContext: trxCtx,
            });
            await adapter.init();

            await trxCtx.run(async () => {
                await adapter.acquire({
                    key: "a",
                    slotId: "1",
                    limit: 4,
                    ttl: null,
                });
                await adapter.acquire({
                    key: "b",
                    slotId: "2",
                    limit: 4,
                    ttl: null,
                });
            });

            const semaphoreRows = await trxCtx.client
                .selectFrom("semaphore")
                .select("semaphore.key")
                .execute();
            const slotRows = await trxCtx.client
                .selectFrom("semaphoreSlot")
                .select("semaphoreSlot.key")
                .execute();

            expect(semaphoreRows.length).toBe(2);
            expect(slotRows.length).toBe(2);
        });
    });
});
