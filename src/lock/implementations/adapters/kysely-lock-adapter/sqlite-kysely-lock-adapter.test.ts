import { randomUUID } from "node:crypto";

import Sqlite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";
import { KyselyLockAdapter } from "@/lock/implementations/adapters/kysely-lock-adapter/_module-exports.js";
import { lockAdapterTestSuite } from "@/lock/implementations/test-utilities/_module-exports.js";
import { WithKyselyTableName } from "@/test-utilities/functions/_module.js";
import { KyselyTransactionAdapter } from "@/transaction-context/implementations/adapters/kysely-transaction-adapter/_module-exports.js";
import { TransactionContext } from "@/transaction-context/implementations/derivables/_module-exports.js";

import type { Database } from "better-sqlite3";
import type { ColumnMetadata, TableMetadata } from "kysely";

import type { KyselyLockTables } from "@/lock/implementations/adapters/kysely-lock-adapter/_module-exports.js";
import type { ITransactionContext } from "@/transaction-context/contracts/_module-exports.js";

describe(
    "sqlite class: KyselyLockAdapter",
    { tags: ["Memory", "Adapters", "Implementations", "Lock"] },
    () => {
        let client: Database;
        let database: Kysely<KyselyLockTables>;
        let adapter: KyselyLockAdapter;
        let tableNames: Record<keyof KyselyLockTables, string>;

        beforeEach(() => {
            vi.clearAllMocks();
            vi.resetAllMocks();
            tableNames = {
                lock: randomUUID(),
            };
            client = new Sqlite(":memory:");
            database = new Kysely<KyselyLockTables>({
                dialect: new SqliteDialect({
                    database: client,
                }),
                plugins: [new WithKyselyTableName(tableNames)],
            });
            adapter = new KyselyLockAdapter({ database });
        });
        afterEach(() => {
            client.close();
        });

        lockAdapterTestSuite({
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
                    .insertInto("lock")
                    .values({
                        key: "a",
                        owner: "owner",
                        expiration: Date.now() - 1000,
                    })
                    .execute();
                await database
                    .insertInto("lock")
                    .values({
                        key: "b",
                        owner: "owner",
                        expiration: Date.now() - 1000,
                    })
                    .execute();
                await database
                    .insertInto("lock")
                    .values({
                        key: "c",
                        owner: "owner",
                        expiration: Date.now() + 50000,
                    })
                    .execute();

                await adapter.removeAllExpired();

                expect(
                    await database
                        .selectFrom("lock")
                        .where("lock.key", "=", "a")
                        .selectAll()
                        .executeTakeFirst(),
                ).toBeUndefined();
                expect(
                    await database
                        .selectFrom("lock")
                        .where("lock.key", "=", "b")
                        .selectAll()
                        .executeTakeFirst(),
                ).toBeUndefined();
                expect(
                    await database
                        .selectFrom("lock")
                        .where("lock.key", "=", "c")
                        .selectAll()
                        .executeTakeFirst(),
                ).toBeDefined();
            });
        });
        describe("method: init", () => {
            test("Should create lock table", async () => {
                await adapter.init();

                const tables = await database.introspection.getTables();

                expect(tables).toContainEqual(
                    expect.objectContaining<Partial<TableMetadata>>({
                        name: tableNames.lock,
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
            test("Should remove lock table", async () => {
                await adapter.init();
                await adapter.deInit();

                const tables = await database.introspection.getTables();

                expect(tables).not.toContainEqual(
                    expect.objectContaining<Partial<TableMetadata>>({
                        name: tableNames.lock,
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
            let trxAdapter: KyselyLockAdapter;
            let trxCtx: ITransactionContext<Kysely<KyselyLockTables>>;
            beforeEach(async () => {
                trxCtx = new TransactionContext({
                    executionContext: new ExecutionContext(
                        new AlsExecutionContextAdapter(),
                    ),
                    adapter: new KyselyTransactionAdapter({
                        database,
                    }),
                });
                trxAdapter = new KyselyLockAdapter({
                    database: trxCtx,
                });
                await trxAdapter.init();
            });
            test("Should not persist changes when the transaction fails", async () => {
                try {
                    await trxCtx.run(async () => {
                        await trxAdapter.acquire("a", "1", null);
                        await trxAdapter.acquire("b", "1", null);
                        throw new Error("Transaction failure");
                    });
                } catch {
                    /* EMPTY */
                }

                const rows = await database
                    .selectFrom("lock")
                    .select("lock.key")
                    .execute();

                expect(rows.length).toBe(0);
            });
            test("Should persist changes when the transaction succeeds", async () => {
                await trxCtx.run(async () => {
                    await trxAdapter.acquire("a", "1", null);
                    await trxAdapter.acquire("b", "1", null);
                });

                const rows = await database
                    .selectFrom("lock")
                    .select("lock.key")
                    .execute();

                expect(rows.length).toBe(2);
            });
        });
    },
);
