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
import {
    LIMITER_POLICIES,
    RATE_LIMITER_STATE,
} from "@/rate-limiter/contracts/_module-exports.js";
import { KyselyRateLimiterAdapter } from "@/rate-limiter/implementations/adapters/kysely-rate-limiter-adapter/_module-exports.js";
import { parseRateLimiterData } from "@/rate-limiter/implementations/adapters/kysely-rate-limiter-adapter/kysely-rate-limiter-entry-document.js";
import { slidingWindowLimiterTestSuite } from "@/rate-limiter/implementations/test-utilities/_module-exports.js";
import { WithKyselyTableName } from "@/test-utilities/functions/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";
import { KyselyTransactionAdapter } from "@/transaction-context/implementations/adapters/kysely-transaction-adapter/_module-exports.js";
import { TransactionContext } from "@/transaction-context/implementations/derivables/_module-exports.js";

import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import type { TableMetadata } from "kysely";

import type { RateLimiterStateEnum } from "@/rate-limiter/contracts/_module-exports.js";
import type { KyselyRateLimiterTables } from "@/rate-limiter/implementations/adapters/kysely-rate-limiter-adapter/_module-exports.js";
import type { ITransactionContext } from "@/transaction-context/contracts/_module-exports.js";

const timeout = TimeSpan.fromMinutes(2);
describe(
    "postgres sliding-window-limiter class: KyselyRateLimiterAdapter",
    { tags: ["Postgres", "Adapters", "Implementations", "RateLimiter"] },
    () => {
        let container: StartedPostgreSqlContainer;
        let client: Pool;
        let database: Kysely<KyselyRateLimiterTables>;
        let tableNames: Record<keyof KyselyRateLimiterTables, string>;

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
                rateLimiter: randomUUID(),
            };
            database = new Kysely<KyselyRateLimiterTables>({
                dialect: new PostgresDialect({
                    pool: client,
                }),
                plugins: [new WithKyselyTableName(tableNames)],
            });
        });
        afterEach(async () => {
            await database.schema.dropTable("rateLimiter").ifExists().execute();
        });

        async function resolveStoredRow(
            key: string,
        ): Promise<{ data: RateLimiterStateEnum; expiration: number }> {
            const row = await database
                .selectFrom("rateLimiter")
                .where("rateLimiter.key", "=", key)
                .select(["rateLimiter.data", "rateLimiter.expiration"])
                .executeTakeFirst();
            if (row === undefined || row.expiration === null) {
                throw new Error("Expected a stored rate limiter row");
            }
            return {
                data: parseRateLimiterData(row.data),
                expiration: Number(row.expiration),
            };
        }
        const windowMs = TimeSpan.fromTimeSpan(
            slidingWindowLimiterTestSuite.rateLimiterPolicySettings.window,
        ).toMilliseconds();
        const marginMs = TimeSpan.fromTimeSpan(
            slidingWindowLimiterTestSuite.rateLimiterPolicySettings.margin,
        ).toMilliseconds();
        const backoffMs = TimeSpan.fromTimeSpan(
            slidingWindowLimiterTestSuite.backoffPolicySettings.delay,
        ).toMilliseconds();
        let adapter: KyselyRateLimiterAdapter;

        beforeEach(() => {
            adapter = new KyselyRateLimiterAdapter({
                database,
                backoffPolicy:
                    slidingWindowLimiterTestSuite.backoffPolicySettings,
                rateLimiterPolicy:
                    slidingWindowLimiterTestSuite.rateLimiterPolicySettings,
            });
        });

        slidingWindowLimiterTestSuite({
            createAdapter: async () => {
                await adapter.init();
                return adapter;
            },
            beforeEach,
            describe,
            expect,
            test,
        });

        describe("method: init", () => {
            test("Should not throw error when called multiple times", async () => {
                await adapter.init();

                const promise = adapter.init();

                await expect(promise).resolves.toBeUndefined();
            });
        });
        describe("method: deInit", () => {
            test("Should remove rate limiter table", async () => {
                await adapter.init();
                await adapter.deInit();

                const tables = await database.introspection.getTables();

                expect(tables).not.toContainEqual(
                    expect.objectContaining<Partial<TableMetadata>>({
                        name: tableNames.rateLimiter,
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
        describe("Expiration tests:", () => {
            test("Should set expiration to the end of the next window plus margin when the attempt is allowed", async () => {
                await adapter.init();
                const key = "a";

                const state = await adapter.updateState(key, 4);

                const row = await resolveStoredRow(key);
                const { data } = row;
                if (data.type !== LIMITER_POLICIES.SLIDING_WINDOW) {
                    throw new Error(
                        "Expected a stored sliding-window rate limiter row",
                    );
                }
                if (data.state.type !== RATE_LIMITER_STATE.ALLOWED) {
                    throw new Error("Expected an allowed rate limiter state");
                }

                const windowStart = Math.max(
                    ...Object.keys(data.state.metrics).map(Number),
                );

                expect(state.success).toBe(true);
                expect(state.resetTime.getTime()).toBe(row.expiration);
                expect(row.expiration).toBe(
                    windowStart + windowMs * 2 + marginMs,
                );
            });
            test("Should set expiration to now plus backoff when the attempt is blocked", async () => {
                await adapter.init();
                const key = "a";
                await adapter.updateState(key, 2);

                const before = Date.now();
                const state = await adapter.updateState(key, 2);
                const after = Date.now();

                const row = await resolveStoredRow(key);

                expect(state.success).toBe(false);
                expect(state.resetTime.getTime()).toBe(row.expiration);
                expect(row.data.type).toBe(LIMITER_POLICIES.SLIDING_WINDOW);
                expect(row.data.state.type).toBe(RATE_LIMITER_STATE.BLOCKED);
                expect(row.expiration).toBeGreaterThanOrEqual(
                    before + backoffMs,
                );
                expect(row.expiration).toBeLessThanOrEqual(after + backoffMs);
            });
        });

        describe("Transaction tests:", () => {
            let trxAdapter: KyselyRateLimiterAdapter;
            let trxCtx: ITransactionContext<Kysely<KyselyRateLimiterTables>>;
            beforeEach(async () => {
                trxCtx = new TransactionContext({
                    executionContext: new ExecutionContext(
                        new AlsExecutionContextAdapter(),
                    ),
                    adapter: new KyselyTransactionAdapter({
                        database,
                    }),
                });
                trxAdapter = new KyselyRateLimiterAdapter({
                    database: trxCtx,
                    backoffPolicy:
                        slidingWindowLimiterTestSuite.backoffPolicySettings,
                    rateLimiterPolicy:
                        slidingWindowLimiterTestSuite.rateLimiterPolicySettings,
                });
                await trxAdapter.init();
            });
            test("Should not persist changes when the transaction fails", async () => {
                try {
                    await trxCtx.run(async () => {
                        await trxAdapter.updateState("a", 1);
                        await trxAdapter.updateState("b", 1);
                        throw new Error("Transaction failure");
                    });
                } catch {
                    /* EMPTY */
                }

                const rows = await database
                    .selectFrom("rateLimiter")
                    .select("rateLimiter.key")
                    .execute();

                expect(rows.length).toBe(0);
            });
            test("Should persist changes when the transaction succeeds", async () => {
                await trxCtx.run(async () => {
                    await trxAdapter.updateState("a", 1);
                    await trxAdapter.updateState("b", 1);
                });

                const rows = await database
                    .selectFrom("rateLimiter")
                    .select("rateLimiter.key")
                    .execute();

                expect(rows.length).toBe(2);
            });
        });
    },
);
