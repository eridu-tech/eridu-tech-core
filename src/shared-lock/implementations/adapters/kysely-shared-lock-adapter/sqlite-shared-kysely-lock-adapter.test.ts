import { randomUUID } from "node:crypto";

import Sqlite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { KyselySharedLockAdapter } from "@/shared-lock/implementations/adapters/kysely-shared-lock-adapter/_module-exports.js";
import { sharedLockAdapterTestSuite } from "@/shared-lock/implementations/test-utilities/_module-exports.js";
import { WithKyselyTableName } from "@/test-utilities/functions/_module.js";

import type { Database } from "better-sqlite3";
import type { ColumnMetadata, TableMetadata } from "kysely";

import type {
    KyselyReaderSemaphoreEntry,
    KyselySharedLockTables,
    KyselyWriterLockEntry,
} from "@/shared-lock/implementations/adapters/kysely-shared-lock-adapter/_module-exports.js";

describe(
    "sqlite class: KyselySharedLockAdapter",
    { tags: ["Memory", "Adapters", "Implementations", "SharedLock"] },
    () => {
        let client: Database;
        let database: Kysely<KyselySharedLockTables>;
        let adapter: KyselySharedLockAdapter;
        let tableNames: Record<keyof KyselySharedLockTables, string>;

        beforeEach(() => {
            vi.clearAllMocks();
            vi.resetAllMocks();
            tableNames = {
                sharedLock: randomUUID(),
            };
            client = new Sqlite(":memory:");
            database = new Kysely<KyselySharedLockTables>({
                dialect: new SqliteDialect({
                    database: client,
                }),
                plugins: [new WithKyselyTableName(tableNames)],
            });
            adapter = new KyselySharedLockAdapter({ database });
        });
        afterEach(() => {
            client.close();
        });

        async function getExpiration(
            key: string,
        ): Promise<number | null | undefined> {
            const sharedLock = await database
                .selectFrom("sharedLock")
                .where("sharedLock.key", "=", key)
                .select("sharedLock.expiration")
                .executeTakeFirst();

            if (sharedLock === undefined) {
                return undefined;
            }
            if (sharedLock.expiration === null) {
                return null;
            }
            return sharedLock.expiration;
        }

        sharedLockAdapterTestSuite({
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
            test("Should remove all rows with passed expiration", async () => {
                await adapter.init();

                await database
                    .insertInto("sharedLock")
                    .values({
                        key: "a",
                        writerLock: JSON.stringify({
                            owner: "owner",
                            expiration: Date.now() - 1000,
                        } satisfies KyselyWriterLockEntry),
                        readerSemaphore: null,
                        expiration: Date.now() - 1000,
                    })
                    .execute();
                await database
                    .insertInto("sharedLock")
                    .values({
                        key: "b",
                        writerLock: null,
                        readerSemaphore: JSON.stringify({
                            limit: 3,
                            slots: [{ id: "1", expiration: Date.now() - 1000 }],
                        } satisfies KyselyReaderSemaphoreEntry),
                        expiration: Date.now() - 1000,
                    })
                    .execute();
                await database
                    .insertInto("sharedLock")
                    .values({
                        key: "c",
                        writerLock: JSON.stringify({
                            owner: "owner",
                            expiration: Date.now() + 50000,
                        } satisfies KyselyWriterLockEntry),
                        readerSemaphore: null,
                        expiration: Date.now() + 50000,
                    })
                    .execute();

                await adapter.removeAllExpired();

                expect(await getExpiration("a")).toBeUndefined();
                expect(await getExpiration("b")).toBeUndefined();
                expect(await getExpiration("c")).toBeGreaterThan(Date.now());
            });
            test("Should not remove rows without expiration", async () => {
                await adapter.init();

                await database
                    .insertInto("sharedLock")
                    .values({
                        key: "a",
                        writerLock: JSON.stringify({
                            owner: "owner",
                            expiration: null,
                        } satisfies KyselyWriterLockEntry),
                        readerSemaphore: null,
                        expiration: null,
                    })
                    .execute();

                await adapter.removeAllExpired();

                expect(await getExpiration("a")).toBeNull();
            });
        });
        describe("Writer expiration tests", () => {
            test("Should set expiration to null when given no expiration", async () => {
                await adapter.init();

                await adapter.acquireWriter("a", "1", null);

                await expect(getExpiration("a")).resolves.toBeNull();
            });
            test("Should set expiration to the ttl when given expiration", async () => {
                await adapter.init();

                const expiration = Date.now() + 60000;

                await adapter.acquireWriter("a", "1", new Date(expiration));

                await expect(getExpiration("a")).resolves.toBe(expiration);
            });
            test("Should update expiration when the writer is refreshed", async () => {
                await adapter.init();

                await adapter.acquireWriter(
                    "a",
                    "1",
                    new Date(Date.now() + 60000),
                );
                const expiration = Date.now() + 120000;

                await adapter.refreshWriter("a", "1", new Date(expiration));

                await expect(getExpiration("a")).resolves.toBe(expiration);
            });
            test("Should remove the row when the writer is released", async () => {
                await adapter.init();

                await adapter.acquireWriter(
                    "a",
                    "1",
                    new Date(Date.now() + 60000),
                );

                await expect(adapter.releaseWriter("a", "1")).resolves.toBe(
                    true,
                );
                await expect(getExpiration("a")).resolves.toBeUndefined();
            });
        });
        describe("Reader expiration tests", () => {
            test("Should set expiration to null when slot is unexpirable", async () => {
                await adapter.init();

                await adapter.acquireReader({
                    key: "a",
                    lockId: "1",
                    limit: 3,
                    ttl: null,
                });

                await expect(getExpiration("a")).resolves.toBeNull();
            });
            test("Should set expiration to the slot expiration when slot is expirable", async () => {
                await adapter.init();

                const expiration = Date.now() + 60000;

                await adapter.acquireReader({
                    key: "a",
                    lockId: "1",
                    limit: 3,
                    ttl: new Date(expiration),
                });

                await expect(getExpiration("a")).resolves.toBe(expiration);
            });
            test("Should set expiration to null when one of the slots is unexpirable", async () => {
                await adapter.init();

                await adapter.acquireReader({
                    key: "a",
                    lockId: "1",
                    limit: 3,
                    ttl: new Date(Date.now() + 60000),
                });
                await adapter.acquireReader({
                    key: "a",
                    lockId: "2",
                    limit: 3,
                    ttl: null,
                });

                await expect(getExpiration("a")).resolves.toBeNull();
            });
            test("Should set expiration to the longest slot expiration", async () => {
                await adapter.init();

                const longestExpiration = Date.now() + 120000;

                await adapter.acquireReader({
                    key: "a",
                    lockId: "1",
                    limit: 3,
                    ttl: new Date(Date.now() + 60000),
                });
                await adapter.acquireReader({
                    key: "a",
                    lockId: "2",
                    limit: 3,
                    ttl: new Date(longestExpiration),
                });

                await expect(getExpiration("a")).resolves.toBe(
                    longestExpiration,
                );
            });
            test("Should set expiration to before current date when all slots are removed", async () => {
                await adapter.init();

                await adapter.acquireReader({
                    key: "a",
                    lockId: "1",
                    limit: 3,
                    ttl: new Date(Date.now() + 60000),
                });
                await adapter.acquireReader({
                    key: "a",
                    lockId: "2",
                    limit: 3,
                    ttl: new Date(Date.now() + 120000),
                });

                await adapter.releaseReader("a", "1");
                await adapter.releaseReader("a", "2");

                const expiration = await getExpiration("a");
                expect(expiration).toBeLessThan(Date.now());
            });
        });
        describe("method: init", () => {
            test("Should create sharedLock table", async () => {
                await adapter.init();

                const tables = await database.introspection.getTables();

                expect(tables).toContainEqual(
                    expect.objectContaining<Partial<TableMetadata>>({
                        name: tableNames.sharedLock,
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
                                name: "writerLock",
                                dataType: "json",
                                isNullable: true,
                                hasDefaultValue: false,
                            }),
                            expect.objectContaining<Partial<ColumnMetadata>>({
                                name: "readerSemaphore",
                                dataType: "json",
                                isNullable: true,
                                hasDefaultValue: false,
                            }),
                            expect.objectContaining<Partial<ColumnMetadata>>({
                                name: "expiration",
                                dataType: "REAL",
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
            test("Should remove sharedLock table", async () => {
                await adapter.init();
                await adapter.deInit();

                const tables = await database.introspection.getTables();

                expect(tables).not.toContainEqual(
                    expect.objectContaining<Partial<TableMetadata>>({
                        name: tableNames.sharedLock,
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
    },
);
