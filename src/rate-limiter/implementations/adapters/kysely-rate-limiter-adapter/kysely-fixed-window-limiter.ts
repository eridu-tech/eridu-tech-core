/**
 * @module RateLimiter
 */

import { sql } from "kysely";

import {
    LIMITER_POLICIES,
    RATE_LIMITER_STATE,
} from "@/rate-limiter/contracts/_module-exports.js";
import { resolveFixedWindowAdapterState } from "@/rate-limiter/implementations/adapters/_shared/_module.js";
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
    FixedWindowLimiterStateEnum,
    IRateLimiterAdapter,
    IRateLimiterAdapterState,
} from "@/rate-limiter/contracts/_module-exports.js";
import type { SerializedFixedWindowLimiterSettings } from "@/rate-limiter/implementations/adapters/_shared/_module.js";
import type {
    KyselyRateLimiterEntryTable,
    KyselyRateLimiterTables,
} from "@/rate-limiter/implementations/adapters/kysely-rate-limiter-adapter/kysely-rate-limiter-entry-document.js";
import type { ITransactionConnection } from "@/transaction-context/contracts/_module-exports.js";

type LimiterStateExpression = {
    data: RawBuilder<string>;
    expiration: RawBuilder<number>;
};

/**
 * @internal
 */
export class KyselyFixedWindowLimiter implements IRateLimiterAdapter {
    constructor(
        private readonly limiterPolicy: Required<SerializedFixedWindowLimiterSettings>,
        private readonly backoffPolicy: Required<SerializedBackoffSettingsEnum>,
        private readonly trxCtx: Pick<
            ITransactionConnection<Kysely<KyselyRateLimiterTables>>,
            "current"
        >,
        private readonly isPostgres: boolean,
    ) {}

    private static resolveRow(
        row: Pick<KyselyRateLimiterEntryTable, "data" | "expiration">,
    ): {
        data: FixedWindowLimiterStateEnum;
        expiration: Date;
    } {
        const data = parseRateLimiterData(row.data);
        if (data.type !== LIMITER_POLICIES.FIXED_WINDOW) {
            throw UnexpectedError.create(
                "KyselyFixedWindowLimiter stored an unexpected limiter policy",
            );
        }
        const expiration = toRateLimiterExpiration(row.expiration);
        if (expiration === null) {
            throw UnexpectedError.create(
                "KyselyFixedWindowLimiter stored an unexpected expiration",
            );
        }
        return { data, expiration };
    }

    private static resolveAllowedMetrics(
        attempt: RawBuilder<number>,
        lastAttemptAt: RawBuilder<number>,
        isPostgres: boolean,
    ): RawBuilder<string> {
        return resolveJsonObjectExpression(
            [
                ["attempt", attempt],
                ["lastAttemptAt", lastAttemptAt],
            ],
            isPostgres,
        );
    }

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
                ["type", sql.lit(LIMITER_POLICIES.FIXED_WINDOW)],
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
        const { window } = this.limiterPolicy;
        const attempt = resolveNumberLiteral(1);
        if (limit < 1) {
            return {
                data: KyselyFixedWindowLimiter.resolveData(
                    KyselyFixedWindowLimiter.resolveBlockedState(
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
            data: KyselyFixedWindowLimiter.resolveData(
                KyselyFixedWindowLimiter.resolveAllowedState(
                    KyselyFixedWindowLimiter.resolveAllowedMetrics(
                        attempt,
                        resolveNumberLiteral(now),
                        isPostgres,
                    ),
                    isPostgres,
                ),
                isPostgres,
            ),
            expiration: resolveIntegerExpression(
                sql<number>`${resolveNumberLiteral(
                    now,
                )} + ${resolveNumberLiteral(window)}`,
                isPostgres,
            ),
        };
    }

    /**
     * State computed from the existing row: tracks the attempt, blocks when the
     * limit is exceeded and lifts the block once the backoff delay has elapsed.
     */
    private resolveNextState(
        limit: number,
        now: number,
        randomValue: number,
    ): LimiterStateExpression {
        const { isPostgres } = this;
        const { window } = this.limiterPolicy;
        const column = "rateLimiter.data";
        const expirationColumn = "rateLimiter.expiration";

        const type = resolveJsonTextExpression(column, ["type"], isPostgres);
        const stateType = resolveJsonTextExpression(
            column,
            ["state", "type"],
            isPostgres,
        );
        const allowedAttempt = resolveJsonNumberExpression(
            column,
            ["state", "metrics", "attempt"],
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

        const isCurrent = sql<boolean>`(${type} = ${sql.lit(
            LIMITER_POLICIES.FIXED_WINDOW,
        )} and ${sql.ref(expirationColumn)} > ${resolveNumberLiteral(now)})`;
        const isAllowed = sql<boolean>`(${stateType} = ${sql.lit(
            RATE_LIMITER_STATE.ALLOWED,
        )})`;
        const trackedIsBlocked = sql<boolean>`(${isCurrent} and not ${isAllowed})`;
        const trackedIsAllowed = sql<boolean>`(not ${trackedIsBlocked})`;
        const trackedAllowedAttempt = sql<number>`(case when ${isCurrent} then coalesce(${allowedAttempt}, 0) else 0 end) + 1`;
        const trackedBlockedAttempt = sql<number>`(case when ${isCurrent} then coalesce(${blockedAttempt}, 0) else 0 end) + 1`;
        // `lastAttemptAt` is set to `now` while tracking, so the window is always open here.
        const shouldBlock = sql<boolean>`(${trackedIsAllowed} and ${trackedAllowedAttempt} > ${resolveNumberLiteral(
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
            sql<number>`(case when ${trackedIsAllowed} then (case when ${shouldBlock} then 1 else ${trackedAllowedAttempt} end) else (case when ${isBlockOver} then 0 else ${trackedBlockedAttempt} end) end)`,
            isPostgres,
        );
        const resultMetricsAttempt = resolveIntegerExpression(
            sql<number>`(case when ${trackedIsAllowed} and not ${shouldBlock} then ${trackedAllowedAttempt} else 0 end)`,
            isPostgres,
        );
        const resultStartedAt = resolveIntegerExpression(
            sql<number>`(case when ${shouldBlock} then ${resolveNumberLiteral(
                now,
            )} else coalesce(${startedAt}, ${resolveNumberLiteral(now)}) end)`,
            isPostgres,
        );

        const data = KyselyFixedWindowLimiter.resolveData(
            sql`(case when ${resultIsAllowed} then ${KyselyFixedWindowLimiter.resolveAllowedState(
                KyselyFixedWindowLimiter.resolveAllowedMetrics(
                    resultMetricsAttempt,
                    resolveNumberLiteral(now),
                    isPostgres,
                ),
                isPostgres,
            )} else ${KyselyFixedWindowLimiter.resolveBlockedState(
                resultAttempt,
                resultStartedAt,
                isPostgres,
            )} end)`,
            isPostgres,
        );
        const expiration = resolveIntegerExpression(
            sql<number>`(case when ${resultIsAllowed} then ${resolveNumberLiteral(
                now + window,
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
        if (data.type !== LIMITER_POLICIES.FIXED_WINDOW) {
            return null;
        }
        return resolveFixedWindowAdapterState(data, expiration);
    }

    async updateState(
        key: string,
        limit: number,
    ): Promise<IRateLimiterAdapterState> {
        const now = Date.now();
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
        const resolved = KyselyFixedWindowLimiter.resolveRow(row);
        return resolveFixedWindowAdapterState(
            resolved.data,
            resolved.expiration,
        );
    }

    async reset(key: string): Promise<void> {
        await this.trxCtx.current
            .deleteFrom("rateLimiter")
            .where("rateLimiter.key", "=", key)
            .execute();
    }
}
