/**
 * @module RateLimiter
 */
import { sql } from "kysely";

import {
    LIMITER_POLICIES,
    RATE_LIMITER_STATE,
} from "@/rate-limiter/contracts/_module-exports.js";
import {
    resolveSlidingWindowAdapterState,
    resolveSlidingWindowStart,
} from "@/rate-limiter/implementations/adapters/_shared/_module.js";
import { resolveBackoffDelayExpression } from "@/rate-limiter/implementations/adapters/kysely-rate-limiter-adapter/kysely-backoff-delay-expression.js";
import {
    resolveIntegerExpression,
    resolveJsonNumberExpression,
    resolveJsonObjectExpression,
    resolveJsonTextExpression,
    resolveNumberLiteral,
} from "@/rate-limiter/implementations/adapters/kysely-rate-limiter-adapter/kysely-json-expression.js";
import {
    parseRateLimiterData,
    toRateLimiterExpiration,
} from "@/rate-limiter/implementations/adapters/kysely-rate-limiter-adapter/kysely-rate-limiter-entry-document.js";
import { UnexpectedError } from "@/utilities/_module-exports.js";

import type { Kysely, RawBuilder } from "kysely";

import type { SerializedBackoffSettingsEnum } from "@/backoff-policies/implementations/_module-exports.js";
import type {
    IRateLimiterAdapter,
    IRateLimiterAdapterState,
} from "@/rate-limiter/contracts/_module-exports.js";
import type { SerializedSlidingWindowLimiterSettings } from "@/rate-limiter/implementations/adapters/_shared/_module.js";
import type { KyselyRateLimiterTables } from "@/rate-limiter/implementations/adapters/kysely-rate-limiter-adapter/kysely-rate-limiter-entry-document.js";
import type { ITransactionConnection } from "@/transaction-context/contracts/_module-exports.js";

type LimiterStateExpression = {
    data: RawBuilder<string>;
    expiration: RawBuilder<number>;
};

/**
 * @internal
 */
export class KyselySlidingWindowLimiter implements IRateLimiterAdapter {
    constructor(
        private readonly rateLimiterPolicy: Required<SerializedSlidingWindowLimiterSettings>,
        private readonly backoffPolicy: Required<SerializedBackoffSettingsEnum>,
        private readonly trxCtx: Pick<
            ITransactionConnection<Kysely<KyselyRateLimiterTables>>,
            "current"
        >,
        private readonly isPostgres: boolean,
    ) {}

    private static resolveAllowedState(
        metrics: RawBuilder<unknown>,
        isPostgres: boolean,
    ): RawBuilder<string> {
        return resolveJsonObjectExpression(
            [
                ["type", sql.lit(RATE_LIMITER_STATE.ALLOWED)],
                ["metrics", metrics],
            ],
            isPostgres,
        );
    }

    private static resolveBlockedState(
        attempt: RawBuilder<number>,
        startedAt: RawBuilder<number>,
        isPostgres: boolean,
    ): RawBuilder<string> {
        return resolveJsonObjectExpression(
            [
                ["type", sql.lit(RATE_LIMITER_STATE.BLOCKED)],
                ["attempt", attempt],
                ["startedAt", startedAt],
            ],
            isPostgres,
        );
    }

    private static resolveData(
        state: RawBuilder<unknown>,
        isPostgres: boolean,
    ): RawBuilder<string> {
        return resolveJsonObjectExpression(
            [
                ["type", sql.lit(LIMITER_POLICIES.SLIDING_WINDOW)],
                ["state", state],
            ],
            isPostgres,
        );
    }

    private resolveDelay(
        attempt: RawBuilder<number>,
        randomValue: number,
    ): RawBuilder<number> {
        return resolveBackoffDelayExpression(
            this.backoffPolicy,
            attempt,
            randomValue,
            this.isPostgres,
        );
    }

    /**
     * State written when no row exists yet, mirroring `track` + `whenAllowed`
     * applied to the initial metrics.
     */
    private resolveFreshState(
        limit: number,
        now: number,
        randomValue: number,
    ): LimiterStateExpression {
        const { isPostgres } = this;
        const { window, margin } = this.rateLimiterPolicy;
        const windowStart = resolveSlidingWindowStart(new Date(now), window);
        if (1 >= limit) {
            const attempt = resolveNumberLiteral(1);
            return {
                data: KyselySlidingWindowLimiter.resolveData(
                    KyselySlidingWindowLimiter.resolveBlockedState(
                        attempt,
                        resolveNumberLiteral(now),
                        isPostgres,
                    ),
                    isPostgres,
                ),
                expiration: resolveIntegerExpression(
                    sql<number>`${resolveNumberLiteral(
                        now,
                    )} + ${this.resolveDelay(attempt, randomValue)}`,
                    isPostgres,
                ),
            };
        }
        return {
            data: KyselySlidingWindowLimiter.resolveData(
                KyselySlidingWindowLimiter.resolveAllowedState(
                    resolveJsonObjectExpression(
                        [[String(windowStart), resolveNumberLiteral(1)]],
                        isPostgres,
                    ),
                    isPostgres,
                ),
                isPostgres,
            ),
            expiration: resolveIntegerExpression(
                sql<number>`${resolveNumberLiteral(
                    windowStart + window * 2 + margin,
                )}`,
                isPostgres,
            ),
        };
    }

    /**
     * State computed from the existing row. Only the current and the previous
     * window are ever read, and "drop windows older than the previous one" is
     * exactly "keep the previous and the current window", so the updated metrics
     * only ever contains those two keys.
     */
    private resolveNextState(
        limit: number,
        now: number,
        randomValue: number,
    ): LimiterStateExpression {
        const { isPostgres } = this;
        const { window, margin } = this.rateLimiterPolicy;
        const windowStart = resolveSlidingWindowStart(new Date(now), window);
        const previousWindowStart = windowStart - window;
        const percentageInCurrentWindow = (now % window) / window;
        const column = "rateLimiter.data";
        const expirationColumn = "rateLimiter.expiration";

        const type = resolveJsonTextExpression(column, ["type"], isPostgres);
        const stateType = resolveJsonTextExpression(
            column,
            ["state", "type"],
            isPostgres,
        );
        const blockedAttempt = resolveJsonNumberExpression(
            column,
            ["state", "attempt"],
            isPostgres,
        );
        const startedAt = resolveJsonNumberExpression(
            column,
            ["state", "startedAt"],
            isPostgres,
        );
        const currentCount = resolveJsonNumberExpression(
            column,
            ["state", "metrics", String(windowStart)],
            isPostgres,
        );
        const previousCount = resolveJsonNumberExpression(
            column,
            ["state", "metrics", String(previousWindowStart)],
            isPostgres,
        );

        const isCurrent = sql<boolean>`(${type} = ${sql.lit(
            LIMITER_POLICIES.SLIDING_WINDOW,
        )} and ${sql.ref(expirationColumn)} > ${resolveNumberLiteral(now)})`;
        const isAllowed = sql<boolean>`(${stateType} = ${sql.lit(
            RATE_LIMITER_STATE.ALLOWED,
        )})`;
        const trackedIsBlocked = sql<boolean>`(${isCurrent} and not ${isAllowed})`;
        const trackedIsAllowed = sql<boolean>`(not ${trackedIsBlocked})`;
        const storedCurrent = sql<number>`(case when ${isCurrent} then coalesce(${currentCount}, 0) else 0 end)`;
        const storedPrevious = sql<number>`(case when ${isCurrent} then coalesce(${previousCount}, 0) else 0 end)`;
        const trackedMetrics = resolveJsonObjectExpression(
            [
                [String(previousWindowStart), storedPrevious],
                [String(windowStart), sql<number>`${storedCurrent} + 1`],
            ],
            isPostgres,
        );
        const attempts = resolveIntegerExpression(
            sql<number>`${storedCurrent} + 1 + ${resolveNumberLiteral(
                1 - percentageInCurrentWindow,
            )} * ${storedPrevious}`,
            isPostgres,
        );
        const trackedBlockedAttempt = sql<number>`(case when ${isCurrent} then coalesce(${blockedAttempt}, 0) else 0 end) + 1`;
        const shouldBlock = sql<boolean>`(${trackedIsAllowed} and ${attempts} >= ${resolveNumberLiteral(
            limit,
        )})`;
        const isBlockOver = sql<boolean>`(${trackedIsBlocked} and (coalesce(${startedAt}, ${resolveNumberLiteral(
            now,
        )}) + ${this.resolveDelay(
            trackedBlockedAttempt,
            randomValue,
        )} <= ${resolveNumberLiteral(now)}))`;

        const resultIsAllowed = sql<boolean>`(case when ${trackedIsAllowed} then not ${shouldBlock} else ${isBlockOver} end)`;
        const resultAttempt = resolveIntegerExpression(
            sql<number>`(case when ${trackedIsAllowed} then (case when ${shouldBlock} then 1 else ${trackedBlockedAttempt} end) else (case when ${isBlockOver} then 0 else ${trackedBlockedAttempt} end) end)`,
            isPostgres,
        );
        const resultStartedAt = resolveIntegerExpression(
            sql<number>`(case when ${shouldBlock} then ${resolveNumberLiteral(
                now,
            )} else coalesce(${startedAt}, ${resolveNumberLiteral(now)}) end)`,
            isPostgres,
        );
        const resultMetrics = sql`(case when ${trackedIsAllowed} and not ${shouldBlock} then ${trackedMetrics} else ${resolveJsonObjectExpression(
            [[String(windowStart), resolveNumberLiteral(0)]],
            isPostgres,
        )} end)`;

        const data = KyselySlidingWindowLimiter.resolveData(
            sql`(case when ${resultIsAllowed} then ${KyselySlidingWindowLimiter.resolveAllowedState(
                resultMetrics,
                isPostgres,
            )} else ${KyselySlidingWindowLimiter.resolveBlockedState(
                resultAttempt,
                resultStartedAt,
                isPostgres,
            )} end)`,
            isPostgres,
        );
        const expiration = resolveIntegerExpression(
            sql<number>`(case when ${resultIsAllowed} then ${resolveNumberLiteral(
                windowStart + window * 2 + margin,
            )} else ${resolveNumberLiteral(now)} + ${this.resolveDelay(
                resultAttempt,
                randomValue,
            )} end)`,
            isPostgres,
        );
        return { data, expiration };
    }

    async getState(key: string): Promise<IRateLimiterAdapterState | null> {
        const currentDate = new Date();
        const row = await this.trxCtx.current
            .selectFrom("rateLimiter")
            .where("rateLimiter.key", "=", key)
            .select(["rateLimiter.data", "rateLimiter.expiration"])
            .executeTakeFirst();
        if (row === undefined) {
            return null;
        }
        const expiration = toRateLimiterExpiration(row.expiration);
        if (expiration === null || expiration <= currentDate) {
            return null;
        }
        const data = parseRateLimiterData(row.data);
        if (data.type !== LIMITER_POLICIES.SLIDING_WINDOW) {
            return null;
        }
        return resolveSlidingWindowAdapterState(
            data,
            expiration,
            currentDate,
            this.rateLimiterPolicy.window,
        );
    }

    async updateState(
        key: string,
        limit: number,
    ): Promise<IRateLimiterAdapterState> {
        const currentDate = new Date();
        const now = currentDate.getTime();
        const randomValue = Math.random();
        const fresh = this.resolveFreshState(limit, now, randomValue);
        const next = this.resolveNextState(limit, now, randomValue);
        const row = await this.trxCtx.current
            .insertInto("rateLimiter")
            .values({
                key,
                data: fresh.data,
                expiration: fresh.expiration,
            })
            .onConflict((oc) =>
                oc.column("key").doUpdateSet({
                    data: next.data,
                    expiration: next.expiration,
                }),
            )
            .returning(["rateLimiter.data", "rateLimiter.expiration"])
            .executeTakeFirstOrThrow();
        const data = parseRateLimiterData(row.data);
        if (data.type !== LIMITER_POLICIES.SLIDING_WINDOW) {
            throw UnexpectedError.create(
                "KyselySlidingWindowLimiter stored an unexpected limiter policy",
            );
        }
        const expiration = toRateLimiterExpiration(row.expiration);
        if (expiration === null) {
            throw UnexpectedError.create(
                "KyselySlidingWindowLimiter stored an unexpected expiration",
            );
        }
        return resolveSlidingWindowAdapterState(
            data,
            expiration,
            currentDate,
            this.rateLimiterPolicy.window,
        );
    }

    async reset(key: string): Promise<void> {
        await this.trxCtx.current
            .deleteFrom("rateLimiter")
            .where("rateLimiter.key", "=", key)
            .execute();
    }
}
