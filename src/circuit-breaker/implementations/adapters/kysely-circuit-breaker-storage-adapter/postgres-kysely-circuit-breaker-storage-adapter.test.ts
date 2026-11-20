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

import { KyselyCircuitBreakerStorageAdapter } from "@/circuit-breaker/implementations/adapters/kysely-circuit-breaker-storage-adapter/kysely-circuit-breaker-storage-adapter.js";
import { circuitBreakerStorageAdapterTestSuite } from "@/circuit-breaker/implementations/test-utilities/_module-exports.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";
import { SuperJsonSerde } from "@/serde/implementations/super-json-serde/_module-exports.js";
import { WithKyselyTableName } from "@/test-utilities/functions/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";
import { KyselyTransactionAdapter } from "@/transaction-context/implementations/adapters/kysely-transaction-adapter/_module-exports.js";
import { TransactionContext } from "@/transaction-context/implementations/derivables/_module-exports.js";

import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import type { ColumnMetadata, TableMetadata } from "kysely";

import type { KyselyCircuitBreakerStorageTables } from "@/circuit-breaker/implementations/adapters/kysely-circuit-breaker-storage-adapter/kysely-circuit-breaker-storage-adapter.js";
import type { ITransactionContext } from "@/transaction-context/contracts/_module-exports.js";

const timeout = TimeSpan.fromMinutes(2);
const tags = ["Postgres"];
describe("postgres class: KyselyCircuitBreakerStorageAdapter", { tags }, () => {
    let container: StartedPostgreSqlContainer;
    let database: Pool;
    let trxCtx: ITransactionContext<Kysely<KyselyCircuitBreakerStorageTables>>;
    let adapter: KyselyCircuitBreakerStorageAdapter<unknown>;
    let tableNames: Record<keyof KyselyCircuitBreakerStorageTables, string>;

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
            circuitBreaker: randomUUID(),
        };
        const kysely = new Kysely<KyselyCircuitBreakerStorageTables>({
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
        adapter = new KyselyCircuitBreakerStorageAdapter({
            transactionContext: trxCtx,
            serde: new SuperJsonSerde(),
        });
    });
    afterEach(async () => {
        await trxCtx.client.schema
            .dropTable("circuitBreaker")
            .ifExists()
            .execute();
    });

    circuitBreakerStorageAdapterTestSuite({
        createAdapter: async () => {
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
            await adapter.init();

            const tables = await trxCtx.client.introspection.getTables();

            expect(tables).toContainEqual(
                expect.objectContaining<Partial<TableMetadata>>({
                    name: tableNames.circuitBreaker,
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
            await adapter.init();

            const promise = adapter.init();

            await expect(promise).resolves.toBeUndefined();
        });
    });
    describe("method: deInit", () => {
        test("Should remove circuit breaker table", async () => {
            await adapter.init();
            await adapter.deInit();

            const tables = await trxCtx.client.introspection.getTables();

            expect(tables).not.toContainEqual(
                expect.objectContaining<Partial<TableMetadata>>({
                    name: tableNames.circuitBreaker,
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
