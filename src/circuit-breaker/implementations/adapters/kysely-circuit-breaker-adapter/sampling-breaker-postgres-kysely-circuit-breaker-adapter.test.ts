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

import {
    BREAKER_POLICIES,
    CIRCUIT_BREAKER_STATE,
} from "@/circuit-breaker/contracts/_module-exports.js";
import { KyselyCircuitBreakerAdapter } from "@/circuit-breaker/implementations/adapters/kysely-circuit-breaker-adapter/_module-exports.js";
import { parseCircuitBreakerData } from "@/circuit-breaker/implementations/adapters/kysely-circuit-breaker-adapter/kysely-circuit-breaker-tables.js";
import { samplingBreakerTestSuite } from "@/circuit-breaker/implementations/test-utilities/_module-exports.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";
import { WithKyselyTableName } from "@/test-utilities/functions/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";
import { KyselyTransactionAdapter } from "@/transaction-context/implementations/adapters/kysely-transaction-adapter/_module-exports.js";
import { TransactionContext } from "@/transaction-context/implementations/derivables/_module-exports.js";

import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import type { ColumnMetadata, TableMetadata } from "kysely";

import type { CircuitBreakerStateEnum } from "@/circuit-breaker/contracts/_module-exports.js";
import type { KyselyCircuitBreakerTables } from "@/circuit-breaker/implementations/adapters/kysely-circuit-breaker-adapter/_module-exports.js";
import type { ITransactionContext } from "@/transaction-context/contracts/_module-exports.js";

const timeout = TimeSpan.fromMinutes(2);
describe(
    "postgres sampling-breaker class: KyselyCircuitBreakerAdapter",
    { tags: ["Postgres", "Adapters", "Implementations", "CircuitBreaker"] },
    () => {
        let container: StartedPostgreSqlContainer;
        let client: Pool;
        let database: Kysely<KyselyCircuitBreakerTables>;
        let tableNames: Record<keyof KyselyCircuitBreakerTables, string>;
        let adapter: KyselyCircuitBreakerAdapter;

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
                circuitBreaker: randomUUID(),
            };
            database = new Kysely<KyselyCircuitBreakerTables>({
                dialect: new PostgresDialect({
                    pool: client,
                }),
                plugins: [new WithKyselyTableName(tableNames)],
            });
            adapter = new KyselyCircuitBreakerAdapter({
                database,
                backoffPolicy: samplingBreakerTestSuite.backoffPolicySettings,
                circuitBreakerPolicy:
                    samplingBreakerTestSuite.circuitBreakerPolicySettings,
            });
        });
        afterEach(async () => {
            await database.schema
                .dropTable("circuitBreaker")
                .ifExists()
                .execute();
        });

        async function resolveStoredData(
            key: string,
        ): Promise<CircuitBreakerStateEnum> {
            const row = await database
                .selectFrom("circuitBreaker")
                .where("circuitBreaker.key", "=", key)
                .select(["circuitBreaker.data"])
                .executeTakeFirst();
            if (row === undefined) {
                throw new Error("Expected a stored circuit breaker row");
            }
            return parseCircuitBreakerData(row.data);
        }

        samplingBreakerTestSuite({
            createAdapter: async () => {
                await adapter.init();
                return adapter;
            },
            beforeEach,
            describe,
            expect,
            test,
        });

        describe("Document tests:", () => {
            test("Should keep the metrics of the tracked calls", async () => {
                await adapter.init();
                const key = "a";

                await adapter.trackFailure(key);
                await adapter.trackFailure(key);
                await adapter.trackSuccess(key);

                const data = await resolveStoredData(key);

                if (data.type !== BREAKER_POLICIES.SAMPLING) {
                    throw new Error("Expected a stored sampling breaker row");
                }
                expect(data.state.type).toBe(CIRCUIT_BREAKER_STATE.CLOSED);
                if (data.state.type !== CIRCUIT_BREAKER_STATE.CLOSED) {
                    throw new Error("Expected a closed breaker state");
                }
                expect(data.state.metrics.samples.length).toBe(1);
                expect(data.state.metrics.samples[0]?.failures).toBe(2);
                expect(data.state.metrics.samples[0]?.successes).toBe(1);
            });
        });

        describe("method: init", () => {
            test("Should create circuit breaker table", async () => {
                await adapter.init();

                const tables = await database.introspection.getTables();

                expect(tables).toContainEqual(
                    expect.objectContaining<Partial<TableMetadata>>({
                        name: tableNames.circuitBreaker,
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
                                name: "data",
                                dataType: "jsonb",
                                isNullable: false,
                                hasDefaultValue: false,
                            }),
                            expect.objectContaining<Partial<ColumnMetadata>>({
                                name: "lastTransitionFrom",
                                dataType: "varchar",
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
            test("Should remove circuit breaker table", async () => {
                await adapter.init();
                await adapter.deInit();

                const tables = await database.introspection.getTables();

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
            let trxAdapter: KyselyCircuitBreakerAdapter;
            let trxCtx: ITransactionContext<Kysely<KyselyCircuitBreakerTables>>;
            beforeEach(async () => {
                trxCtx = new TransactionContext({
                    executionContext: new ExecutionContext(
                        new AlsExecutionContextAdapter(),
                    ),
                    adapter: new KyselyTransactionAdapter({
                        database,
                    }),
                });
                trxAdapter = new KyselyCircuitBreakerAdapter({
                    database: trxCtx,
                    backoffPolicy:
                        samplingBreakerTestSuite.backoffPolicySettings,
                    circuitBreakerPolicy:
                        samplingBreakerTestSuite.circuitBreakerPolicySettings,
                });
                await trxAdapter.init();
            });
            test("Should not persist changes when the transaction fails", async () => {
                try {
                    await trxCtx.run(async () => {
                        await trxAdapter.trackFailure("a");
                        await trxAdapter.updateState("b");
                        throw new Error("Transaction failure");
                    });
                } catch {
                    /* EMPTY */
                }

                const rows = await database
                    .selectFrom("circuitBreaker")
                    .select("circuitBreaker.key")
                    .execute();

                expect(rows.length).toBe(0);
            });
            test("Should persist changes when the transaction succeeds", async () => {
                await trxCtx.run(async () => {
                    await trxAdapter.trackFailure("a");
                    await trxAdapter.updateState("b");
                });

                const rows = await database
                    .selectFrom("circuitBreaker")
                    .select("circuitBreaker.key")
                    .execute();

                expect(rows.length).toBe(2);
            });
        });
    },
);
