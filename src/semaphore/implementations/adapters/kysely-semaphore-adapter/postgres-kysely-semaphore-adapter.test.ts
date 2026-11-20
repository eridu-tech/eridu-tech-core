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

import type { KyselySemaphoreTables } from "@/semaphore/implementations/adapters/kysely-semaphore-adapter/_module-exports.js";
import type { ITransactionContext } from "@/transaction-context/contracts/_module-exports.js";

const timeout = TimeSpan.fromMinutes(2);
describe("postgres class: KyselySemaphoreAdapter", () => {
    let container: StartedPostgreSqlContainer;
    let database: Pool;
    let trxCtx: ITransactionContext<Kysely<KyselySemaphoreTables>>;
    let adapter: KyselySemaphoreAdapter;
    let tableNames: Record<keyof KyselySemaphoreTables, string>;

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
            semaphore: randomUUID(),
            semaphoreSlot: randomUUID(),
        };
        const kysely = new Kysely<KyselySemaphoreTables>({
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
        adapter = new KyselySemaphoreAdapter({ transactionContext: trxCtx });
    });
    afterEach(async () => {
        await trxCtx.client.schema
            .dropTable("semaphoreSlot")
            .ifExists()
            .execute();
        await trxCtx.client.schema.dropTable("semaphore").ifExists().execute();
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
            await adapter.init();

            const tables = await trxCtx.client.introspection.getTables();

            expect(tables).toContainEqual(
                expect.objectContaining<Partial<TableMetadata>>({
                    name: tableNames.semaphore,
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
        test("Should create semaphoreSlot table", async () => {
            await adapter.init();

            const tables = await trxCtx.client.introspection.getTables();

            expect(tables).toContainEqual(
                expect.objectContaining<Partial<TableMetadata>>({
                    name: tableNames.semaphoreSlot,
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
        test("Should remove semaphore table", async () => {
            await adapter.init();
            await adapter.deInit();

            const tables = await trxCtx.client.introspection.getTables();

            expect(tables).not.toContainEqual(
                expect.objectContaining<Partial<TableMetadata>>({
                    name: tableNames.semaphore,
                }),
            );
        });
        test("Should remove semaphoreSlot table", async () => {
            await adapter.init();
            await adapter.deInit();

            const tables = await trxCtx.client.introspection.getTables();

            expect(tables).not.toContainEqual(
                expect.objectContaining<Partial<TableMetadata>>({
                    name: tableNames.semaphoreSlot,
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
