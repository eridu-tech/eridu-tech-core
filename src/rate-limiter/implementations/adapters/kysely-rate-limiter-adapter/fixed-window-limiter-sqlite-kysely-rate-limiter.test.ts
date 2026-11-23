import { randomUUID } from "node:crypto";

import Sqlite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { BACKOFFS } from "@/backoff-policies/implementations/_module-exports.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";
import {
    LIMITER_POLICIES,
    RATE_LIMITER_STATE,
} from "@/rate-limiter/contracts/_module-exports.js";
import { KyselyRateLimiterAdapter } from "@/rate-limiter/implementations/adapters/kysely-rate-limiter-adapter/_module-exports.js";
import { parseRateLimiterData } from "@/rate-limiter/implementations/adapters/kysely-rate-limiter-adapter/kysely-rate-limiter-entry-document.js";
import { fixedWindowLimiterTestSuite } from "@/rate-limiter/implementations/test-utilities/_module-exports.js";
import { WithKyselyTableName } from "@/test-utilities/functions/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";
import { KyselyTransactionAdapter } from "@/transaction-context/implementations/adapters/kysely-transaction-adapter/_module-exports.js";
import { TransactionContext } from "@/transaction-context/implementations/derivables/_module-exports.js";

import type { Database } from "better-sqlite3";
import type { ColumnMetadata, TableMetadata } from "kysely";

import type { RateLimiterStateEnum } from "@/rate-limiter/contracts/_module-exports.js";
import type { KyselyRateLimiterTables } from "@/rate-limiter/implementations/adapters/kysely-rate-limiter-adapter/_module-exports.js";
import type { ITransactionContext } from "@/transaction-context/contracts/_module-exports.js";

describe(
    "sqlite fixed-window-limiter class: KyselyRateLimiterAdapter",
    { tags: ["Memory", "Adapters", "Implementations", "RateLimiter"] },
    () => {
        let client: Database;
        let database: Kysely<KyselyRateLimiterTables>;
        let tableNames: Record<keyof KyselyRateLimiterTables, string>;

        beforeEach(() => {
            vi.clearAllMocks();
            vi.resetAllMocks();
            tableNames = {
                rateLimiter: randomUUID(),
            };
            client = new Sqlite(":memory:");
            database = new Kysely<KyselyRateLimiterTables>({
                dialect: new SqliteDialect({
                    database: client,
                }),
                plugins: [new WithKyselyTableName(tableNames)],
            });
        });
        afterEach(() => {
            client.close();
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
            fixedWindowLimiterTestSuite.rateLimiterPolicySettings.window,
        ).toMilliseconds();
        const backoffMs = TimeSpan.fromTimeSpan(
            fixedWindowLimiterTestSuite.backoffPolicySettings.delay,
        ).toMilliseconds();
        let adapter: KyselyRateLimiterAdapter;

        beforeEach(() => {
            adapter = new KyselyRateLimiterAdapter({
                database,
                backoffPolicy:
                    fixedWindowLimiterTestSuite.backoffPolicySettings,
                rateLimiterPolicy:
                    fixedWindowLimiterTestSuite.rateLimiterPolicySettings,
            });
        });

        fixedWindowLimiterTestSuite({
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
            test("Should create rate limiter table", async () => {
                await adapter.init();

                const tables = await database.introspection.getTables();

                expect(tables).toContainEqual(
                    expect.objectContaining<Partial<TableMetadata>>({
                        name: tableNames.rateLimiter,
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
                                name: "data",
                                dataType: "json",
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
            test("Should set expiration to lastAttemptAt plus window when the attempt is allowed", async () => {
                await adapter.init();
                const key = "a";

                const state = await adapter.updateState(key, 4);

                const row = await resolveStoredRow(key);
                const { data } = row;
                if (data.type !== LIMITER_POLICIES.FIXED_WINDOW) {
                    throw new Error(
                        "Expected a stored fixed-window rate limiter row",
                    );
                }
                if (data.state.type !== RATE_LIMITER_STATE.ALLOWED) {
                    throw new Error("Expected an allowed rate limiter state");
                }

                expect(state.success).toBe(true);
                expect(state.resetTime.getTime()).toBe(row.expiration);
                expect(row.expiration).toBe(
                    data.state.metrics.lastAttemptAt + windowMs,
                );
            });
            test("Should set expiration to now plus backoff when the attempt is blocked", async () => {
                await adapter.init();
                const key = "a";
                await adapter.updateState(key, 1);

                const before = Date.now();
                const state = await adapter.updateState(key, 1);
                const after = Date.now();

                const row = await resolveStoredRow(key);

                expect(state.success).toBe(false);
                expect(state.resetTime.getTime()).toBe(row.expiration);
                expect(row.data.type).toBe(LIMITER_POLICIES.FIXED_WINDOW);
                expect(row.data.state.type).toBe(RATE_LIMITER_STATE.BLOCKED);
                expect(row.expiration).toBeGreaterThanOrEqual(
                    before + backoffMs,
                );
                expect(row.expiration).toBeLessThanOrEqual(after + backoffMs);
            });
        });

        describe("Backoff policy tests:", () => {
            test("Should grow the blocked expiration with an exponential backoff", async () => {
                const exponentialAdapter = new KyselyRateLimiterAdapter({
                    database,
                    rateLimiterPolicy: {
                        type: LIMITER_POLICIES.FIXED_WINDOW,
                        window: TimeSpan.fromMilliseconds(100),
                    },
                    backoffPolicy: {
                        type: BACKOFFS.EXPONENTIAL,
                        minDelay: TimeSpan.fromMilliseconds(10),
                        multiplier: 3,
                        maxDelay: TimeSpan.fromMilliseconds(1000),
                        jitter: null,
                    },
                });
                await exponentialAdapter.init();
                const key = "a";
                await exponentialAdapter.updateState(key, 1);

                const before1 = Date.now();
                const state1 = await exponentialAdapter.updateState(key, 1);
                const after1 = Date.now();

                expect(state1).toEqual({
                    success: false,
                    attempt: 1,
                    resetTime: expect.any(Date) as Date,
                });
                expect(state1.resetTime.getTime()).toBeGreaterThanOrEqual(
                    before1 + 30,
                );
                expect(state1.resetTime.getTime()).toBeLessThanOrEqual(
                    after1 + 30,
                );

                const before2 = Date.now();
                const state2 = await exponentialAdapter.updateState(key, 1);
                const after2 = Date.now();

                expect(state2).toEqual({
                    success: false,
                    attempt: 2,
                    resetTime: expect.any(Date) as Date,
                });
                expect(state2.resetTime.getTime()).toBeGreaterThanOrEqual(
                    before2 + 90,
                );
                expect(state2.resetTime.getTime()).toBeLessThanOrEqual(
                    after2 + 90,
                );
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
                        fixedWindowLimiterTestSuite.backoffPolicySettings,
                    rateLimiterPolicy:
                        fixedWindowLimiterTestSuite.rateLimiterPolicySettings,
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
