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

import { KyselyCacheAdapter } from "@/cache/implementations/adapters/kysely-cache-adapter/_module-exports.js";
import { cacheAdapterTestSuite } from "@/cache/implementations/test-utilities/_module-exports.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";
import { SuperJsonSerde } from "@/serde/implementations/super-json-serde/_module-exports.js";
import { WithKyselyTableName } from "@/test-utilities/functions/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";
import { KyselyTransactionAdapter } from "@/transaction-context/implementations/adapters/kysely-transaction-adapter/_module-exports.js";
import { TransactionContext } from "@/transaction-context/implementations/derivables/_module-exports.js";

import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import type { ColumnMetadata, TableMetadata } from "kysely";

import type { KyselyCacheTables } from "@/cache/implementations/adapters/kysely-cache-adapter/_module-exports.js";
import type { ITransactionContext } from "@/transaction-context/contracts/_module-exports.js";

const timeout = TimeSpan.fromMinutes(2);
describe("postgres class: KyselyCacheAdapter", { tags: ["Postgres"] }, () => {
    let container: StartedPostgreSqlContainer;
    let database: Pool;
    let trxCtx: ITransactionContext<Kysely<KyselyCacheTables>>;
    let adapter: KyselyCacheAdapter;
    let tableNames: Record<keyof KyselyCacheTables, string>;

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
            cache: randomUUID(),
        };
        const kysely = new Kysely<KyselyCacheTables>({
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
        adapter = new KyselyCacheAdapter({
            transactionContext: trxCtx,
            serde: new SuperJsonSerde(),
        });
    });
    afterEach(async () => {
        await trxCtx.client.schema.dropTable("cache").ifExists().execute();
    });

    cacheAdapterTestSuite({
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

            await trxCtx.client
                .insertInto("cache")
                .values({
                    key: "a",
                    value: "value",
                    expiration: Date.now() - 1000,
                })
                .execute();
            await trxCtx.client
                .insertInto("cache")
                .values({
                    key: "b",
                    value: "value",
                    expiration: Date.now() - 1000,
                })
                .execute();
            await trxCtx.client
                .insertInto("cache")
                .values({
                    key: "c",
                    value: "value",
                    expiration: Date.now() + 50000,
                })
                .execute();

            await adapter.removeAllExpired();

            expect(
                await trxCtx.client
                    .selectFrom("cache")
                    .where("cache.key", "=", "a")
                    .selectAll()
                    .executeTakeFirst(),
            ).toBeUndefined();
            expect(
                await trxCtx.client
                    .selectFrom("cache")
                    .where("cache.key", "=", "b")
                    .selectAll()
                    .executeTakeFirst(),
            ).toBeUndefined();
            expect(
                await trxCtx.client
                    .selectFrom("cache")
                    .where("cache.key", "=", "c")
                    .selectAll()
                    .executeTakeFirst(),
            ).toBeDefined();
        });
    });
    describe("method: init", () => {
        test("Should create cache table", async () => {
            await adapter.init();

            const tables = await trxCtx.client.introspection.getTables();

            expect(tables).toContainEqual(
                expect.objectContaining<Partial<TableMetadata>>({
                    name: tableNames.cache,
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument
                    columns: expect.arrayContaining<Partial<ColumnMetadata>>([
                        expect.objectContaining<Partial<ColumnMetadata>>({
                            name: "key",
                            dataType: "varchar",
                            isNullable: false,
                            hasDefaultValue: false,
                        }),
                        expect.objectContaining<Partial<ColumnMetadata>>({
                            name: "value",
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
        test("Should remove cache table", async () => {
            await adapter.init();
            await adapter.deInit();

            const tables = await trxCtx.client.introspection.getTables();

            expect(tables).not.toContainEqual(
                expect.objectContaining<Partial<TableMetadata>>({
                    name: tableNames.cache,
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
        test("Should not persist changes when the transaction fails", async () => {
            await adapter.init();

            try {
                await trxCtx.run(async () => {
                    await adapter.add("a", 1, null);
                    await adapter.add("b", 1, null);
                    throw new Error("Transaction failure");
                });
            } catch {
                /* EMPTY */
            }

            const rows = await trxCtx.client
                .selectFrom("cache")
                .select("cache.key")
                .execute();

            expect(rows.length).toBe(0);
        });
        test("Should persist changes when the transaction succeeds", async () => {
            await adapter.init();

            await trxCtx.run(async () => {
                await adapter.add("a", 1, null);
                await adapter.add("b", 1, null);
            });

            const rows = await trxCtx.client
                .selectFrom("cache")
                .select("cache.key")
                .execute();

            expect(rows.length).toBe(2);
        });
    });
});
