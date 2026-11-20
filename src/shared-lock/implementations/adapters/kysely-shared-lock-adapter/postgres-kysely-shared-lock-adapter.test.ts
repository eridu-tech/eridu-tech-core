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
import { KyselySharedLockAdapter } from "@/shared-lock/implementations/adapters/kysely-shared-lock-adapter/_module-exports.js";
import { sharedLockAdapterTestSuite } from "@/shared-lock/implementations/test-utilities/_module-exports.js";
import { WithKyselyTableName } from "@/test-utilities/functions/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";
import { KyselyTransactionAdapter } from "@/transaction-context/implementations/adapters/kysely-transaction-adapter/_module-exports.js";
import { TransactionContext } from "@/transaction-context/implementations/derivables/_module-exports.js";

import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import type { ColumnMetadata, TableMetadata } from "kysely";

import type { KyselySharedLockTables } from "@/shared-lock/implementations/adapters/kysely-shared-lock-adapter/_module-exports.js";
import type { ITransactionContext } from "@/transaction-context/contracts/_module-exports.js";

const timeout = TimeSpan.fromMinutes(2);
const tags = ["Postgres"];
describe("postgres class: KyselySharedLockAdapter", { tags }, () => {
    let container: StartedPostgreSqlContainer;
    let database: Pool;
    let trxCtx: ITransactionContext<Kysely<KyselySharedLockTables>>;
    let adapter: KyselySharedLockAdapter;
    let tableNames: Record<keyof KyselySharedLockTables, string>;

    beforeAll(async () => {
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
    afterAll(async () => {
        await database.end();
        await container.stop();
    }, timeout.toMilliseconds());
    beforeEach(() => {
        vi.clearAllMocks();
        vi.resetAllMocks();
        tableNames = {
            writerLock: randomUUID(),
            readerSemaphore: randomUUID(),
            readerSemaphoreSlot: randomUUID(),
        };
        const kysely = new Kysely<KyselySharedLockTables>({
            dialect: new PostgresDialect({
                pool: database,
            }),
            plugins: [new WithKyselyTableName(tableNames)],
        });
        trxCtx = new TransactionContext({
            executionContext: new ExecutionContext(
                new AlsExecutionContextAdapter(),
            ),
            adapter: new KyselyTransactionAdapter({
                database: kysely,
            }),
        });
        adapter = new KyselySharedLockAdapter({ transactionContext: trxCtx });
    });
    afterEach(async () => {
        await trxCtx.client.schema
            .dropTable("readerSemaphoreSlot")
            .ifExists()
            .execute();
        await trxCtx.client.schema
            .dropTable("readerSemaphore")
            .ifExists()
            .execute();
        await trxCtx.client.schema.dropTable("writerLock").ifExists().execute();
    });

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
        test("Should remove all expired writer locks", async () => {
            await adapter.init();

            await trxCtx.client
                .insertInto("writerLock")
                .values({
                    key: "a",
                    owner: "owner",
                    expiration: Date.now() - 1000,
                })
                .execute();
            await trxCtx.client
                .insertInto("writerLock")
                .values({
                    key: "b",
                    owner: "owner",
                    expiration: Date.now() - 1000,
                })
                .execute();
            await trxCtx.client
                .insertInto("writerLock")
                .values({
                    key: "c",
                    owner: "owner",
                    expiration: Date.now() + 50000,
                })
                .execute();

            await adapter.removeAllExpired();

            expect(
                await trxCtx.client
                    .selectFrom("writerLock")
                    .where("writerLock.key", "=", "a")
                    .selectAll()
                    .executeTakeFirst(),
            ).toBeUndefined();
            expect(
                await trxCtx.client
                    .selectFrom("writerLock")
                    .where("writerLock.key", "=", "b")
                    .selectAll()
                    .executeTakeFirst(),
            ).toBeUndefined();
            expect(
                await trxCtx.client
                    .selectFrom("writerLock")
                    .where("writerLock.key", "=", "c")
                    .selectAll()
                    .executeTakeFirst(),
            ).toBeDefined();
        });
        test("Should remove all expired reader semaphores", async () => {
            await adapter.init();

            const limit = 3;
            const key1 = "1";
            const key2 = "2";

            await trxCtx.client
                .insertInto("readerSemaphore")
                .values({ key: key1, limit })
                .execute();
            await trxCtx.client
                .insertInto("readerSemaphore")
                .values({ key: key2, limit })
                .execute();

            await trxCtx.client
                .insertInto("readerSemaphoreSlot")
                .values({ key: key1, id: "1", expiration: Date.now() - 1000 })
                .execute();
            await trxCtx.client
                .insertInto("readerSemaphoreSlot")
                .values({ key: key1, id: "2", expiration: Date.now() - 1000 })
                .execute();
            await trxCtx.client
                .insertInto("readerSemaphoreSlot")
                .values({ key: key1, id: "3", expiration: Date.now() - 1000 })
                .execute();

            await trxCtx.client
                .insertInto("readerSemaphoreSlot")
                .values({ key: key2, id: "4", expiration: Date.now() - 1000 })
                .execute();
            await trxCtx.client
                .insertInto("readerSemaphoreSlot")
                .values({ key: key2, id: "5", expiration: Date.now() - 1000 })
                .execute();
            await trxCtx.client
                .insertInto("readerSemaphoreSlot")
                .values({ key: key2, id: "6", expiration: Date.now() - 1000 })
                .execute();

            await adapter.removeAllExpired();

            expect(
                await trxCtx.client
                    .selectFrom("readerSemaphore")
                    .where("readerSemaphore.key", "=", key1)
                    .selectAll()
                    .executeTakeFirst(),
            ).toBeUndefined();

            expect(
                await trxCtx.client
                    .selectFrom("readerSemaphoreSlot")
                    .where("readerSemaphoreSlot.key", "=", key1)
                    .selectAll()
                    .execute(),
            ).toEqual([]);

            expect(
                await trxCtx.client
                    .selectFrom("readerSemaphoreSlot")
                    .where("readerSemaphoreSlot.key", "=", key2)
                    .selectAll()
                    .execute(),
            ).toEqual([]);

            expect(
                await trxCtx.client
                    .selectFrom("readerSemaphore")
                    .where("readerSemaphore.key", "=", key2)
                    .selectAll()
                    .executeTakeFirst(),
            ).toBeUndefined();
        });
    });
    describe("method: init", () => {
        test("Should create writerLock table", async () => {
            await adapter.init();

            const tables = await trxCtx.client.introspection.getTables();

            expect(tables).toContainEqual(
                expect.objectContaining<Partial<TableMetadata>>({
                    name: tableNames.writerLock,
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
        test("Should create readerSemaphore table", async () => {
            await adapter.init();

            const tables = await trxCtx.client.introspection.getTables();

            expect(tables).toContainEqual(
                expect.objectContaining<Partial<TableMetadata>>({
                    name: tableNames.readerSemaphore,
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument
                    columns: expect.arrayContaining<Partial<ColumnMetadata>>([
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
                    ]),
                }),
            );
        });
        test("Should create readerSemaphoreSlot table", async () => {
            await adapter.init();

            const tables = await trxCtx.client.introspection.getTables();

            expect(tables).toContainEqual(
                expect.objectContaining<Partial<TableMetadata>>({
                    name: tableNames.readerSemaphoreSlot,
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument
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
            await adapter.init();

            const promise = adapter.init();

            await expect(promise).resolves.toBeUndefined();
        });
    });
    describe("method: deInit", () => {
        test("Should remove writer lock table", async () => {
            await adapter.init();
            await adapter.deInit();

            const tables = await trxCtx.client.introspection.getTables();

            expect(tables).not.toContainEqual(
                expect.objectContaining<Partial<TableMetadata>>({
                    name: tableNames.writerLock,
                }),
            );
        });
        test("Should remove readerSemaphore table", async () => {
            await adapter.init();
            await adapter.deInit();

            const tables = await trxCtx.client.introspection.getTables();

            expect(tables).not.toContainEqual(
                expect.objectContaining<Partial<TableMetadata>>({
                    name: tableNames.readerSemaphore,
                }),
            );
        });
        test("Should remove readerSemaphoreSlot table", async () => {
            await adapter.init();
            await adapter.deInit();

            const tables = await trxCtx.client.introspection.getTables();

            expect(tables).not.toContainEqual(
                expect.objectContaining<Partial<TableMetadata>>({
                    name: tableNames.readerSemaphoreSlot,
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
            await adapter.init();

            await expect(promise).resolves.toBeUndefined();
        });
    });
    describe("Transaction tests:", () => {
        test("Should not persist changes when the transaction fails", async () => {
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
        test("Should persist changes when the transaction succeeds", async () => {
            await adapter.init();

            await trxCtx.run(async () => {
                await adapter.acquireReader({
                    key: "a",
                    lockId: "1",
                    limit: 4,
                    ttl: null,
                });
                await adapter.acquireReader({
                    key: "b",
                    lockId: "2",
                    limit: 4,
                    ttl: null,
                });
            });

            const semaphoreRows = await trxCtx.client
                .selectFrom("readerSemaphore")
                .select("readerSemaphore.key")
                .execute();
            const slotRows = await trxCtx.client
                .selectFrom("readerSemaphoreSlot")
                .select("readerSemaphoreSlot.key")
                .execute();

            expect(semaphoreRows.length).toBe(2);
            expect(slotRows.length).toBe(2);
        });
    });
});
