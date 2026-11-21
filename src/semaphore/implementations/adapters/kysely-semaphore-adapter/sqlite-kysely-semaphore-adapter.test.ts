import { randomUUID } from "node:crypto";

import Sqlite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";
import { KyselySemaphoreAdapter } from "@/semaphore/implementations/adapters/kysely-semaphore-adapter/_module-exports.js";
import { semaphoreAdapterTestSuite } from "@/semaphore/implementations/test-utilities/_module-exports.js";
import { WithKyselyTableName } from "@/test-utilities/functions/_module.js";
import { KyselyTransactionAdapter } from "@/transaction-context/implementations/adapters/kysely-transaction-adapter/_module-exports.js";
import { TransactionContext } from "@/transaction-context/implementations/derivables/_module-exports.js";

import type { Database } from "better-sqlite3";
import type { ColumnMetadata, TableMetadata } from "kysely";

import type {
    KyselySemaphoreSlotEntry,
    KyselySemaphoreTables,
} from "@/semaphore/implementations/adapters/kysely-semaphore-adapter/_module-exports.js";
import type { ITransactionContext } from "@/transaction-context/contracts/_module-exports.js";

function toSlots(
    slots: Array<KyselySemaphoreSlotEntry> | string,
): Array<KyselySemaphoreSlotEntry> {
    if (typeof slots === "string") {
        return JSON.parse(slots) as Array<KyselySemaphoreSlotEntry>;
    }
    return slots;
}

describe(
    "sqlite class: KyselySemaphoreAdapter",
    { tags: ["Memory", "Adapters", "Implementations", "Semaphore"] },
    () => {
        let client: Database;
        let database: Kysely<KyselySemaphoreTables>;
        let adapter: KyselySemaphoreAdapter;
        let tableNames: Record<keyof KyselySemaphoreTables, string>;

        beforeEach(() => {
            vi.clearAllMocks();
            vi.resetAllMocks();
            tableNames = {
                semaphore: randomUUID(),
            };
            client = new Sqlite(":memory:");
            database = new Kysely<KyselySemaphoreTables>({
                dialect: new SqliteDialect({
                    database: client,
                }),
                plugins: [new WithKyselyTableName(tableNames)],
            });
            adapter = new KyselySemaphoreAdapter({ database });
        });
        afterEach(() => {
            client.close();
        });

        semaphoreAdapterTestSuite({
            createAdapter: async () => {
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
                await adapter.init();

                await database
                    .insertInto("semaphore")
                    .values({
                        key: "a",
                        limit: 3,
                        slots: JSON.stringify([
                            { id: "1", expiration: Date.now() - 1000 },
                        ] satisfies Array<KyselySemaphoreSlotEntry>),
                    })
                    .execute();
                await database
                    .insertInto("semaphore")
                    .values({
                        key: "b",
                        limit: 3,
                        slots: JSON.stringify([
                            { id: "2", expiration: Date.now() - 1000 },
                        ] satisfies Array<KyselySemaphoreSlotEntry>),
                    })
                    .execute();
                await database
                    .insertInto("semaphore")
                    .values({
                        key: "c",
                        limit: 3,
                        slots: JSON.stringify([
                            { id: "3", expiration: Date.now() + 50000 },
                        ] satisfies Array<KyselySemaphoreSlotEntry>),
                    })
                    .execute();

                await adapter.removeAllExpired();

                expect(
                    await database
                        .selectFrom("semaphore")
                        .where("semaphore.key", "=", "a")
                        .selectAll()
                        .executeTakeFirst(),
                ).toBeUndefined();
                expect(
                    await database
                        .selectFrom("semaphore")
                        .where("semaphore.key", "=", "b")
                        .selectAll()
                        .executeTakeFirst(),
                ).toBeUndefined();
                expect(
                    await database
                        .selectFrom("semaphore")
                        .where("semaphore.key", "=", "c")
                        .selectAll()
                        .executeTakeFirst(),
                ).toBeDefined();
            });
        });
        describe("method: init", () => {
            test("Should create semaphore table", async () => {
                await adapter.init();

                const tables = await database.introspection.getTables();

                expect(tables).toContainEqual(
                    expect.objectContaining<Partial<TableMetadata>>({
                        name: tableNames.semaphore,
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument
                        columns: expect.arrayContaining<
                            Partial<ColumnMetadata>
                        >([
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
                            expect.objectContaining<Partial<ColumnMetadata>>({
                                name: "slots",
                                dataType: "json",
                                isNullable: false,
                                hasDefaultValue: false,
                            }),
                        ] as Array<Partial<ColumnMetadata>>),
                    }),
                );
            });
            test("Should not throw error when called multiple times", async () => {
                await adapter.init();

                const promise = adapter.init();

                await expect(promise).resolves.toBeUndefined();
            });
        });
        describe("method: deInit", () => {
            test("Should remove semaphore table", async () => {
                await adapter.init();
                await adapter.deInit();

                const tables = await database.introspection.getTables();

                expect(tables).not.toContainEqual(
                    expect.objectContaining<Partial<TableMetadata>>({
                        name: tableNames.semaphore,
                    }),
                );
            });
            test("Should not throw error when called multiple times", async () => {
                await adapter.init();
                await adapter.deInit();

                const promise = adapter.deInit();

                await expect(promise).resolves.toBeUndefined();
            });
            test("Should not throw error when called before init", async () => {
                const promise = adapter.deInit();

                await expect(promise).resolves.toBeUndefined();
            });
        });
        describe("Transaction tests:", () => {
            let trxAdapter: KyselySemaphoreAdapter;
            let trxCtx: ITransactionContext<Kysely<KyselySemaphoreTables>>;
            beforeEach(async () => {
                trxCtx = new TransactionContext({
                    executionContext: new ExecutionContext(
                        new AlsExecutionContextAdapter(),
                    ),
                    adapter: new KyselyTransactionAdapter({
                        database,
                    }),
                });
                trxAdapter = new KyselySemaphoreAdapter({
                    database: trxCtx,
                });
                await trxAdapter.init();
            });
            test("Should not persist changes when the transaction fails", async () => {
                try {
                    await trxCtx.run(async () => {
                        await trxAdapter.acquire({
                            key: "a",
                            slotId: "1",
                            limit: 4,
                            ttl: null,
                        });
                        await trxAdapter.acquire({
                            key: "b",
                            slotId: "2",
                            limit: 4,
                            ttl: null,
                        });
                        throw new Error("Transaction failure");
                    });
                } catch {
                    /* EMPTY */
                }

                const semaphoreRows = await database
                    .selectFrom("semaphore")
                    .select("semaphore.key")
                    .execute();

                expect(semaphoreRows.length).toBe(0);
            });
            test("Should persist changes when the transaction succeeds", async () => {
                await trxCtx.run(async () => {
                    await trxAdapter.acquire({
                        key: "a",
                        slotId: "1",
                        limit: 4,
                        ttl: null,
                    });
                    await trxAdapter.acquire({
                        key: "b",
                        slotId: "2",
                        limit: 4,
                        ttl: null,
                    });
                });

                const semaphoreRows = await database
                    .selectFrom("semaphore")
                    .select(["semaphore.key", "semaphore.slots"])
                    .execute();

                expect(semaphoreRows.length).toBe(2);
                expect(
                    semaphoreRows.flatMap((row) =>
                        toSlots(row.slots).map((slot) => slot.id),
                    ),
                ).toEqual(["1", "2"]);
            });
        });
    },
);
