import { randomUUID } from "node:crypto";

import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import {
    afterAll,
    afterEach,
    beforeAll,
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from "vitest";

import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";
import { KyselySemaphoreAdapter } from "@/semaphore/implementations/adapters/kysely-semaphore-adapter/_module-exports.js";
import { semaphoreAdapterTestSuite } from "@/semaphore/implementations/test-utilities/_module-exports.js";
import { WithKyselyTableName } from "@/test-utilities/functions/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";
import { KyselyTransactionAdapter } from "@/transaction-context/implementations/adapters/kysely-transaction-adapter/_module-exports.js";
import { TransactionContext } from "@/transaction-context/implementations/derivables/_module-exports.js";

import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
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

const timeout = TimeSpan.fromMinutes(2);
describe(
    "postgres class: KyselySemaphoreAdapter",
    { tags: ["Postgres", "Adapters", "Implementations", "Semaphore"] },
    () => {
        let container: StartedPostgreSqlContainer;
        let client: Pool;
        let database: Kysely<KyselySemaphoreTables>;
        let adapter: KyselySemaphoreAdapter;
        let tableNames: Record<keyof KyselySemaphoreTables, string>;

        beforeAll(async () => {
            container = await new PostgreSqlContainer("postgres:17.5").start();
            client = new Pool({
                database: container.getDatabase(),
                host: container.getHost(),
                user: container.getUsername(),
                port: container.getPort(),
                password: container.getPassword(),
                max: 10,
            });
        }, timeout.toMilliseconds());
        afterAll(async () => {
            await client.end();
            await container.stop();
        }, timeout.toMilliseconds());
        beforeEach(() => {
            vi.clearAllMocks();
            vi.resetAllMocks();
            tableNames = {
                semaphore: randomUUID(),
            };
            database = new Kysely<KyselySemaphoreTables>({
                dialect: new PostgresDialect({
                    pool: client,
                }),
                plugins: [new WithKyselyTableName(tableNames)],
            });
            adapter = new KyselySemaphoreAdapter({ database });
        });
        afterEach(async () => {
            await database.schema.dropTable("semaphore").ifExists().execute();
        });

        async function getExpiration(
            key: string,
        ): Promise<number | null | undefined> {
            const semaphore = await database
                .selectFrom("semaphore")
                .where("semaphore.key", "=", key)
                .select("semaphore.expiration")
                .executeTakeFirst();

            if (semaphore === undefined) {
                return undefined;
            }
            if (semaphore.expiration === null) {
                return null;
            }
            return semaphore.expiration;
        }

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
            test("Should remove all rows with passed expiration", async () => {
                await adapter.init();

                await database
                    .insertInto("semaphore")
                    .values({
                        key: "a",
                        limit: 3,
                        slots: JSON.stringify([
                            { id: "1", expiration: Date.now() - 1000 },
                        ] satisfies Array<KyselySemaphoreSlotEntry>),
                        expiration: Date.now() - 1000,
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
                        expiration: Date.now() - 1000,
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
                    .insertInto("semaphore")
                    .values({
                        key: "a",
                        limit: 3,
                        slots: JSON.stringify([
                            { id: "1", expiration: null },
                        ] satisfies Array<KyselySemaphoreSlotEntry>),
                        expiration: null,
                    })
                    .execute();

                await adapter.removeAllExpired();

                expect(await getExpiration("a")).toBeNull();
            });
        });
        describe("Expiration tests", () => {
            test("Should set expiration to null when slot is unexpireable", async () => {
                await adapter.init();

                await adapter.acquire({
                    key: "a",
                    slotId: "1",
                    limit: 3,
                    ttl: null,
                });

                await expect(getExpiration("a")).resolves.toBeNull();
            });
            test("Should set expiration to the slot expiration when slot is expirable", async () => {
                await adapter.init();

                const expiration = Date.now() + 60000;

                await adapter.acquire({
                    key: "a",
                    slotId: "1",
                    limit: 3,
                    ttl: new Date(expiration),
                });

                await expect(getExpiration("a")).resolves.toBe(expiration);
            });
            test("Should set expiration to null when one of the slots is unexpireable", async () => {
                await adapter.init();

                await adapter.acquire({
                    key: "a",
                    slotId: "1",
                    limit: 3,
                    ttl: new Date(Date.now() + 60000),
                });
                await adapter.acquire({
                    key: "a",
                    slotId: "2",
                    limit: 3,
                    ttl: null,
                });

                await expect(getExpiration("a")).resolves.toBeNull();
            });
            test("Should set expiration to the longest slot expiration", async () => {
                await adapter.init();

                const longestExpiration = Date.now() + 120000;

                await adapter.acquire({
                    key: "a",
                    slotId: "1",
                    limit: 3,
                    ttl: new Date(Date.now() + 60000),
                });
                await adapter.acquire({
                    key: "a",
                    slotId: "2",
                    limit: 3,
                    ttl: new Date(longestExpiration),
                });

                await expect(getExpiration("a")).resolves.toBe(
                    longestExpiration,
                );
            });
            test("Should update expiration when the slot is refreshed", async () => {
                await adapter.init();

                await adapter.acquire({
                    key: "a",
                    slotId: "1",
                    limit: 3,
                    ttl: new Date(Date.now() + 60000),
                });
                const expiration = Date.now() + 120000;

                await adapter.refresh("a", "1", new Date(expiration));

                await expect(getExpiration("a")).resolves.toBe(expiration);
            });
            test("Should set expiration to before current date when each slot is individually removed", async () => {
                await adapter.init();

                await adapter.acquire({
                    key: "a",
                    slotId: "1",
                    limit: 3,
                    ttl: new Date(Date.now() + 60000),
                });
                await adapter.acquire({
                    key: "a",
                    slotId: "2",
                    limit: 3,
                    ttl: new Date(Date.now() + 120000),
                });

                await adapter.release("a", "1");
                await adapter.release("a", "2");

                const expiration = await getExpiration("a");
                expect(expiration).toBeLessThan(Date.now());
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
                                dataType: "varchar",
                                isNullable: false,
                                hasDefaultValue: false,
                            }),
                            expect.objectContaining<Partial<ColumnMetadata>>({
                                name: "limit",
                                dataType: "int4",
                                isNullable: false,
                                hasDefaultValue: false,
                            }),
                            expect.objectContaining<Partial<ColumnMetadata>>({
                                name: "slots",
                                dataType: "jsonb",
                                isNullable: false,
                                hasDefaultValue: false,
                            }),
                            expect.objectContaining<Partial<ColumnMetadata>>({
                                name: "expiration",
                                dataType: "float8",
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
                await trxAdapter.init();

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
                await trxAdapter.init();

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
