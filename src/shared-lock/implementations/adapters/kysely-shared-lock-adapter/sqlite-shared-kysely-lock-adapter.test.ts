import Sqlite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { contextToken } from "@/execution-context/contracts/_module.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import { KyselySharedLockAdapter } from "@/shared-lock/implementations/adapters/kysely-shared-lock-adapter/_module.js";
import { sharedLockAdapterTestSuite } from "@/shared-lock/implementations/test-utilities/_module.js";
import { KyselyTransactionAdapter } from "@/transaction-context/implementations/adapters/kysely-transaction-adapter/_module.js";
import { TransactionContext } from "@/transaction-context/implementations/derivables/_module.js";

import type { Database } from "better-sqlite3";
import type { ColumnMetadata, TableMetadata } from "kysely";

import type { KyselySharedLockTables } from "@/shared-lock/implementations/adapters/kysely-shared-lock-adapter/_module.js";
import type { ITransactionContext } from "@/transaction-context/contracts/_module.js";

describe("sqlite class: KyselySharedLockAdapter", () => {
    let database: Database;
    let kysely: Kysely<KyselySharedLockTables>;

    beforeEach(() => {
        database = new Sqlite(":memory:");
        kysely = new Kysely({
            dialect: new SqliteDialect({
                database,
            }),
        });
    });
    afterEach(() => {
        database.close();
    });
    function createTrxCtx(
        database_: Database,
    ): ITransactionContext<Kysely<KyselySharedLockTables>> {
        return new TransactionContext({
            token: contextToken("kysely"),
            executionContext: new ExecutionContext(
                new AlsExecutionContextAdapter(),
            ),
            adapter: new KyselyTransactionAdapter({
                database: new Kysely({
                    dialect: new SqliteDialect({
                        database: database_,
                    }),
                }),
            }),
        });
    }

    sharedLockAdapterTestSuite({
        createAdapter: async () => {
            const adapter = new KyselySharedLockAdapter({
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
        test("Should remove all expired writer locks", async () => {
            const adapter = new KyselySharedLockAdapter({
                transactionContext: createTrxCtx(database),
            });
            await adapter.init();

            await kysely
                .insertInto("writerLock")
                .values({
                    key: "a",
                    owner: "owner",
                    expiration: Date.now() - 1000,
                })
                .execute();
            await kysely
                .insertInto("writerLock")
                .values({
                    key: "b",
                    owner: "owner",
                    expiration: Date.now() - 1000,
                })
                .execute();
            await kysely
                .insertInto("writerLock")
                .values({
                    key: "c",
                    owner: "owner",
                    expiration: Date.now() + 50000,
                })
                .execute();

            await adapter.removeAllExpired();

            expect(
                await kysely
                    .selectFrom("writerLock")
                    .where("writerLock.key", "=", "a")
                    .selectAll()
                    .executeTakeFirst(),
            ).toBeUndefined();
            expect(
                await kysely
                    .selectFrom("writerLock")
                    .where("writerLock.key", "=", "b")
                    .selectAll()
                    .executeTakeFirst(),
            ).toBeUndefined();
            expect(
                await kysely
                    .selectFrom("writerLock")
                    .where("writerLock.key", "=", "c")
                    .selectAll()
                    .executeTakeFirst(),
            ).toBeDefined();
        });
        test("Should remove all expired reader semaphores", async () => {
            const adapter = new KyselySharedLockAdapter({
                transactionContext: createTrxCtx(database),
            });
            await adapter.init();

            const limit = 3;
            const key1 = "1";
            const key2 = "2";

            await kysely
                .insertInto("readerSemaphore")
                .values({ key: key1, limit })
                .execute();
            await kysely
                .insertInto("readerSemaphore")
                .values({ key: key2, limit })
                .execute();

            await kysely
                .insertInto("readerSemaphoreSlot")
                .values({ key: key1, id: "1", expiration: Date.now() - 1000 })
                .execute();
            await kysely
                .insertInto("readerSemaphoreSlot")
                .values({ key: key1, id: "2", expiration: Date.now() - 1000 })
                .execute();
            await kysely
                .insertInto("readerSemaphoreSlot")
                .values({ key: key1, id: "3", expiration: Date.now() - 1000 })
                .execute();

            await kysely
                .insertInto("readerSemaphoreSlot")
                .values({ key: key2, id: "4", expiration: Date.now() - 1000 })
                .execute();
            await kysely
                .insertInto("readerSemaphoreSlot")
                .values({ key: key2, id: "5", expiration: Date.now() - 1000 })
                .execute();
            await kysely
                .insertInto("readerSemaphoreSlot")
                .values({ key: key2, id: "6", expiration: Date.now() - 1000 })
                .execute();

            await adapter.removeAllExpired();

            expect(
                await kysely
                    .selectFrom("readerSemaphore")
                    .where("readerSemaphore.key", "=", key1)
                    .selectAll()
                    .executeTakeFirst(),
            ).toBeUndefined();

            expect(
                await kysely
                    .selectFrom("readerSemaphoreSlot")
                    .where("readerSemaphoreSlot.key", "=", key1)
                    .selectAll()
                    .execute(),
            ).toEqual([]);

            expect(
                await kysely
                    .selectFrom("readerSemaphoreSlot")
                    .where("readerSemaphoreSlot.key", "=", key2)
                    .selectAll()
                    .execute(),
            ).toEqual([]);

            expect(
                await kysely
                    .selectFrom("readerSemaphore")
                    .where("readerSemaphore.key", "=", key2)
                    .selectAll()
                    .executeTakeFirst(),
            ).toBeUndefined();
        });
    });
    describe("method: init", () => {
        test("Should create writerLock table", async () => {
            const adapter = new KyselySharedLockAdapter({
                transactionContext: createTrxCtx(database),
            });
            await adapter.init();

            const tables = await kysely.introspection.getTables();

            expect(tables).toContainEqual(
                expect.objectContaining<Partial<TableMetadata>>({
                    name: "writerLock",
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument
                    columns: expect.arrayContaining<Partial<ColumnMetadata>>([
                        expect.objectContaining<Partial<ColumnMetadata>>({
                            name: "key",
                            dataType: "varchar(255)",
                            isNullable: false,
                            hasDefaultValue: false,
                        }),
                        expect.objectContaining<Partial<ColumnMetadata>>({
                            name: "owner",
                            dataType: "varchar(255)",
                            isNullable: false,
                            hasDefaultValue: false,
                        }),
                        expect.objectContaining<Partial<ColumnMetadata>>({
                            name: "expiration",
                            dataType: "bigint",
                            isNullable: true,
                            hasDefaultValue: false,
                        }),
                    ]),
                }),
            );
        });
        test("Should create readerSemaphore table", async () => {
            const adapter = new KyselySharedLockAdapter({
                transactionContext: createTrxCtx(database),
            });
            await adapter.init();

            const tables = await kysely.introspection.getTables();

            expect(tables).toContainEqual(
                expect.objectContaining<Partial<TableMetadata>>({
                    name: "readerSemaphore",
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument
                    columns: expect.arrayContaining<Partial<ColumnMetadata>>([
                        expect.objectContaining<Partial<ColumnMetadata>>({
                            name: "key",
                            dataType: "varchar(255)",
                            isNullable: false,
                            hasDefaultValue: false,
                        }),
                        expect.objectContaining<Partial<ColumnMetadata>>({
                            name: "limit",
                            dataType: "INTEGER",
                            isNullable: false,
                            hasDefaultValue: false,
                        }),
                    ]),
                }),
            );
        });
        test("Should create readerSemaphoreSlot table", async () => {
            const adapter = new KyselySharedLockAdapter({
                transactionContext: createTrxCtx(database),
            });
            await adapter.init();

            const tables = await kysely.introspection.getTables();

            expect(tables).toContainEqual(
                expect.objectContaining<Partial<TableMetadata>>({
                    name: "readerSemaphoreSlot",
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument
                    columns: expect.arrayContaining<Partial<ColumnMetadata>>([
                        expect.objectContaining<Partial<ColumnMetadata>>({
                            name: "key",
                            dataType: "varchar(255)",
                            isNullable: false,
                            hasDefaultValue: false,
                        }),
                        expect.objectContaining<Partial<ColumnMetadata>>({
                            name: "id",
                            dataType: "varchar(255)",
                            isNullable: false,
                            hasDefaultValue: false,
                        }),
                        expect.objectContaining<Partial<ColumnMetadata>>({
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
            const adapter = new KyselySharedLockAdapter({
                transactionContext: createTrxCtx(database),
            });
            await adapter.init();

            const promise = adapter.init();

            await expect(promise).resolves.toBeUndefined();
        });
    });
    describe("method: deInit", () => {
        test("Should remove writer lock table", async () => {
            const adapter = new KyselySharedLockAdapter({
                transactionContext: createTrxCtx(database),
            });
            await adapter.init();
            await adapter.deInit();

            const tables = await kysely.introspection.getTables();

            expect(tables).not.toContainEqual(
                expect.objectContaining<Partial<TableMetadata>>({
                    name: "writerLock",
                }),
            );
        });
        test("Should remove readerSemaphore table", async () => {
            const adapter = new KyselySharedLockAdapter({
                transactionContext: createTrxCtx(database),
            });
            await adapter.init();
            await adapter.deInit();

            const tables = await kysely.introspection.getTables();

            expect(tables).not.toContainEqual(
                expect.objectContaining<Partial<TableMetadata>>({
                    name: "readerSemaphore",
                }),
            );
        });
        test("Should remove readerSemaphoreSlot table", async () => {
            const adapter = new KyselySharedLockAdapter({
                transactionContext: createTrxCtx(database),
            });
            await adapter.init();
            await adapter.deInit();

            const tables = await kysely.introspection.getTables();

            expect(tables).not.toContainEqual(
                expect.objectContaining<Partial<TableMetadata>>({
                    name: "readerSemaphoreSlot",
                }),
            );
        });
        test("Should not throw error when called multiple times", async () => {
            const adapter = new KyselySharedLockAdapter({
                transactionContext: createTrxCtx(database),
            });
            await adapter.init();
            await adapter.deInit();
            const promise = adapter.deInit();

            await expect(promise).resolves.toBeUndefined();
        });
        test("Should not throw error when called before init", async () => {
            const adapter = new KyselySharedLockAdapter({
                transactionContext: createTrxCtx(database),
            });
            const promise = adapter.deInit();
            await adapter.init();

            await expect(promise).resolves.toBeUndefined();
        });
    });
    test("Transaction test", async () => {
        const trxCtx = createTrxCtx(database);
        const adapter = new KyselySharedLockAdapter({
            transactionContext: trxCtx,
        });
        await adapter.init();

        try {
            await trxCtx.run(async () => {
                await adapter.acquireReader({
                    key: "a",
                    lockId: "1",
                    limit: 4,
                    ttl: null,
                });
                await adapter.acquireReader({
                    key: "b",
                    lockId: "1",
                    limit: 4,
                    ttl: null,
                });
                throw new Error("Transaction failure");
            });
        } catch {
            /* EMPTY */
        }

        const semaphoreRows = await trxCtx.client
            .selectFrom("readerSemaphore")
            .select("readerSemaphore.key")
            .execute();
        const slotRows = await trxCtx.client
            .selectFrom("readerSemaphoreSlot")
            .select("readerSemaphoreSlot.key")
            .execute();

        expect(semaphoreRows.length).toBe(0);
        expect(slotRows.length).toBe(0);
    });
});
