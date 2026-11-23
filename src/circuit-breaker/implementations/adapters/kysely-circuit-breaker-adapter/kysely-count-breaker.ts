/**
 * @module CircuitBreaker
 */

import { sql } from "kysely";

import {
    BREAKER_POLICIES,
    CIRCUIT_BREAKER_STATE,
} from "@/circuit-breaker/contracts/_module-exports.js";
import { resolveBackoffDelayExpression } from "@/circuit-breaker/implementations/adapters/kysely-circuit-breaker-adapter/kysely-backoff-delay-expression.js";
import {
    resolveArrayAppendExpression,
    resolveArrayFalseCountExpression,
    resolveArrayLengthExpression,
    resolveArrayTailExpression,
    resolveArrayTrueCountExpression,
    resolveCeilExpression,
    resolveJsonArrayExpression,
} from "@/circuit-breaker/implementations/adapters/kysely-circuit-breaker-adapter/kysely-circuit-breaker-expression.js";
import { parseCircuitBreakerData } from "@/circuit-breaker/implementations/adapters/kysely-circuit-breaker-adapter/kysely-circuit-breaker-tables.js";
import {
    resolveIntegerExpression,
    resolveJsonNumberExpression,
    resolveJsonObjectExpression,
    resolveJsonTextExpression,
    resolveNumberLiteral,
} from "@/circuit-breaker/implementations/adapters/kysely-circuit-breaker-adapter/kysely-json-expression.js";
import { UnexpectedError } from "@/utilities/_module-exports.js";

import type { Kysely, RawBuilder } from "kysely";

import type { SerializedBackoffSettingsEnum } from "@/backoff-policies/implementations/_module-exports.js";
import type {
    CircuitBreakerState,
    CircuitBreakerStateTransition,
    CountBreakerSettingsEnum,
    ICircuitBreakerAdapter,
} from "@/circuit-breaker/contracts/_module-exports.js";
import type { KyselyCircuitBreakerTables } from "@/circuit-breaker/implementations/adapters/kysely-circuit-breaker-adapter/kysely-circuit-breaker-tables.js";
import type { ITransactionConnection } from "@/transaction-context/contracts/_module-exports.js";

/**
 * The count breaker stored in a sql table: the breaker breaks after a proportion of
 * the calls in a count based sliding window fail.
 *
 * Every method is a single statement and joins the transaction of the surrounding
 * transaction context when one is active.
 *
 * @internal
 */
export class KyselyCountBreaker implements ICircuitBreakerAdapter {
    private static readonly POLICY = BREAKER_POLICIES.COUNT;
    private static readonly COLUMN = "circuitBreaker.data";

    private static resolveSamples(
        samples: RawBuilder<unknown>,
        isPostgres: boolean,
    ): RawBuilder<string> {
        return resolveJsonObjectExpression([["samples", samples]], isPostgres);
    }

    private static resolveClosedState(
        samples: RawBuilder<unknown>,
        isPostgres: boolean,
    ): RawBuilder<string> {
        return resolveJsonObjectExpression(
            [
                ["type", sql.lit(CIRCUIT_BREAKER_STATE.CLOSED)],
                [
                    "metrics",
                    KyselyCountBreaker.resolveSamples(samples, isPostgres),
                ],
            ],
            isPostgres,
        );
    }

    private static resolveHalfOpenState(
        attempt: RawBuilder<number>,
        samples: RawBuilder<unknown>,
        isPostgres: boolean,
    ): RawBuilder<string> {
        return resolveJsonObjectExpression(
            [
                ["type", sql.lit(CIRCUIT_BREAKER_STATE.HALF_OPEN)],
                ["attempt", attempt],
                [
                    "metrics",
                    KyselyCountBreaker.resolveSamples(samples, isPostgres),
                ],
            ],
            isPostgres,
        );
    }

    private static resolveOpenState(
        attempt: RawBuilder<number>,
        startedAt: RawBuilder<number>,
        isPostgres: boolean,
    ): RawBuilder<string> {
        return resolveJsonObjectExpression(
            [
                ["type", sql.lit(CIRCUIT_BREAKER_STATE.OPEN)],
                ["attempt", attempt],
                ["startedAt", startedAt],
            ],
            isPostgres,
        );
    }

    private static resolveIsolatedState(
        isPostgres: boolean,
    ): RawBuilder<string> {
        return resolveJsonObjectExpression(
            [["type", sql.lit(CIRCUIT_BREAKER_STATE.ISOLATED)]],
            isPostgres,
        );
    }

    private static resolveData(
        state: RawBuilder<unknown>,
        isPostgres: boolean,
    ): RawBuilder<string> {
        return resolveJsonObjectExpression(
            [
                ["type", sql.lit(KyselyCountBreaker.POLICY)],
                ["state", state],
            ],
            isPostgres,
        );
    }

    constructor(
        private readonly circuitBreakerPolicy: Required<CountBreakerSettingsEnum>,
        private readonly backoffPolicy: Required<SerializedBackoffSettingsEnum>,
        private readonly trxCtx: Pick<
            ITransactionConnection<Kysely<KyselyCircuitBreakerTables>>,
            "current"
        >,
        private readonly isPostgres: boolean,
    ) {}

    private getEmptySamples(): RawBuilder<unknown> {
        if (this.isPostgres) {
            return sql<string>`'[]'::jsonb`;
        }
        return sql<string>`'[]'`;
    }

    private resolveEmptyData(): RawBuilder<string> {
        return KyselyCountBreaker.resolveData(
            KyselyCountBreaker.resolveClosedState(
                this.getEmptySamples(),
                this.isPostgres,
            ),
            this.isPostgres,
        );
    }

    /**
     * State written when no row exists yet, mirroring `track` applied to the
     * initial metrics.
     */
    private resolveFreshTrackedData(success: boolean): RawBuilder<string> {
        return KyselyCountBreaker.resolveData(
            KyselyCountBreaker.resolveClosedState(
                resolveArrayAppendExpression(
                    this.getEmptySamples(),
                    this.resolveJsonBoolean(success),
                    this.isPostgres,
                ),
                this.isPostgres,
            ),
            this.isPostgres,
        );
    }

    private resolveColumns(): {
        isCurrent: RawBuilder<boolean>;
        stateType: RawBuilder<string | null>;
        samples: RawBuilder<string>;
        attempt: RawBuilder<number | null>;
        startedAt: RawBuilder<number | null>;
    } {
        const { isPostgres } = this;
        const column = KyselyCountBreaker.COLUMN;
        const type = resolveJsonTextExpression(column, ["type"], isPostgres);
        const stateType = resolveJsonTextExpression(
            column,
            ["state", "type"],
            isPostgres,
        );
        return {
            isCurrent: sql<boolean>`(${type} = ${sql.lit(
                KyselyCountBreaker.POLICY,
            )} and ${stateType} is not null)`,
            stateType,
            samples: resolveJsonArrayExpression(
                column,
                ["state", "metrics", "samples"],
                isPostgres,
            ),
            attempt: resolveJsonNumberExpression(
                column,
                ["state", "attempt"],
                isPostgres,
            ),
            startedAt: resolveJsonNumberExpression(
                column,
                ["state", "startedAt"],
                isPostgres,
            ),
        };
    }

    private resolveAttempt(): RawBuilder<number> {
        return resolveIntegerExpression(
            sql<number>`coalesce(${this.resolveColumns().attempt}, 0)`,
            this.isPostgres,
        );
    }

    /**
     * Mirrors `CircuitBreakerStateManager.updateState`.
     */
    private resolveNextData(
        now: number,
        randomValue: number,
    ): { data: RawBuilder<string>; lastTransitionFrom: RawBuilder<string> } {
        const { isPostgres } = this;
        const { isCurrent, stateType, samples, startedAt } =
            this.resolveColumns();
        const { failureThreshold, successThreshold, minimumNumberOfCalls } =
            this.circuitBreakerPolicy;
        const nowLiteral = resolveNumberLiteral(now);
        const attempt = this.resolveAttempt();
        const total = resolveArrayLengthExpression(samples, isPostgres);
        const failureCount = resolveArrayFalseCountExpression(
            samples,
            isPostgres,
        );
        const successCount = resolveArrayTrueCountExpression(
            samples,
            isPostgres,
        );
        const isMinimumNotMet = sql<boolean>`(${total} <= ${resolveNumberLiteral(
            minimumNumberOfCalls,
        )})`;
        const hasFailed = sql<boolean>`(not ${isMinimumNotMet} and ${failureCount} > ${resolveCeilExpression(
            sql<number>`${resolveNumberLiteral(failureThreshold)} * ${total}`,
            isPostgres,
        )})`;
        const isWaitTimeOver = sql<boolean>`(coalesce(${startedAt}, ${nowLiteral}) + ${resolveBackoffDelayExpression(
            this.backoffPolicy,
            attempt,
            randomValue,
            isPostgres,
        )} <= ${nowLiteral})`;
        const unchanged = KyselyCountBreaker.resolveHalfOpenState(
            attempt,
            samples,
            isPostgres,
        );
        const closedTransition = sql`(case when ${hasFailed} then ${KyselyCountBreaker.resolveOpenState(
            resolveNumberLiteral(1),
            nowLiteral,
            isPostgres,
        )} else ${KyselyCountBreaker.resolveClosedState(
            samples,
            isPostgres,
        )} end)`;
        const openTransition = sql`(case when ${isWaitTimeOver} then ${KyselyCountBreaker.resolveHalfOpenState(
            attempt,
            this.getEmptySamples(),
            isPostgres,
        )} else ${KyselyCountBreaker.resolveOpenState(
            attempt,
            resolveIntegerExpression(
                sql<number>`coalesce(${startedAt}, ${nowLiteral})`,
                isPostgres,
            ),
            isPostgres,
        )} end)`;
        const halfOpenTransition = sql`(case when ${isMinimumNotMet} then ${unchanged} when ${successCount} >= ${resolveCeilExpression(
            sql<number>`${resolveNumberLiteral(successThreshold)} * ${total}`,
            isPostgres,
        )} then ${KyselyCountBreaker.resolveClosedState(
            this.getEmptySamples(),
            isPostgres,
        )} else ${KyselyCountBreaker.resolveOpenState(
            resolveIntegerExpression(sql<number>`${attempt} + 1`, isPostgres),
            nowLiteral,
            isPostgres,
        )} end)`;
        const state = sql`(case when not ${isCurrent} then ${KyselyCountBreaker.resolveClosedState(
            this.getEmptySamples(),
            isPostgres,
        )} when ${stateType} = ${sql.lit(
            CIRCUIT_BREAKER_STATE.CLOSED,
        )} then ${closedTransition} when ${stateType} = ${sql.lit(
            CIRCUIT_BREAKER_STATE.OPEN,
        )} then ${openTransition} when ${stateType} = ${sql.lit(
            CIRCUIT_BREAKER_STATE.HALF_OPEN,
        )} then ${halfOpenTransition} else ${KyselyCountBreaker.resolveIsolatedState(
            isPostgres,
        )} end)`;
        return {
            data: KyselyCountBreaker.resolveData(state, isPostgres),
            lastTransitionFrom: sql<string>`(case when ${isCurrent} then ${stateType} else ${sql.lit(
                CIRCUIT_BREAKER_STATE.CLOSED,
            )} end)`,
        };
    }

    /**
     * Mirrors `CircuitBreakerStateManager.trackFailure` and `trackSuccess`.
     */
    private resolveTrackedData(success: boolean): {
        data: RawBuilder<string>;
        lastTransitionFrom: RawBuilder<string>;
    } {
        const { isPostgres } = this;
        const { isCurrent, stateType, samples, attempt, startedAt } =
            this.resolveColumns();
        const appended = resolveArrayAppendExpression(
            samples,
            this.resolveJsonBoolean(success),
            isPostgres,
        );
        const tracked = sql`(case when ${resolveArrayLengthExpression(
            samples,
            isPostgres,
        )} >= ${resolveNumberLiteral(
            this.circuitBreakerPolicy.size,
        )} then ${resolveArrayTailExpression(
            appended,
            isPostgres,
        )} else ${appended} end)`;
        const closedTracked = KyselyCountBreaker.resolveClosedState(
            tracked,
            isPostgres,
        );
        const halfOpenTracked = KyselyCountBreaker.resolveHalfOpenState(
            resolveIntegerExpression(
                sql<number>`coalesce(${attempt}, 0)`,
                isPostgres,
            ),
            tracked,
            isPostgres,
        );
        const open = KyselyCountBreaker.resolveOpenState(
            resolveIntegerExpression(
                sql<number>`coalesce(${attempt}, 0)`,
                isPostgres,
            ),
            resolveIntegerExpression(
                sql<number>`coalesce(${startedAt}, 0)`,
                isPostgres,
            ),
            isPostgres,
        );
        const state = sql`(case when not ${isCurrent} then ${closedTracked} when ${stateType} = ${sql.lit(
            CIRCUIT_BREAKER_STATE.CLOSED,
        )} then ${closedTracked} when ${stateType} = ${sql.lit(
            CIRCUIT_BREAKER_STATE.HALF_OPEN,
        )} then ${halfOpenTracked} when ${stateType} = ${sql.lit(
            CIRCUIT_BREAKER_STATE.OPEN,
        )} then ${open} else ${KyselyCountBreaker.resolveIsolatedState(
            isPostgres,
        )} end)`;
        return {
            data: KyselyCountBreaker.resolveData(state, isPostgres),
            lastTransitionFrom: sql<string>`(case when ${isCurrent} then ${stateType} else ${sql.lit(
                CIRCUIT_BREAKER_STATE.CLOSED,
            )} end)`,
        };
    }

    private resolveJsonBoolean(value: boolean): RawBuilder<unknown> {
        if (this.isPostgres) {
            return sql.raw(value ? "true" : "false");
        }
        return sql.raw(value ? "'true'" : "'false'");
    }

    async getState(key: string): Promise<CircuitBreakerState> {
        const row = await this.trxCtx.current
            .selectFrom("circuitBreaker")
            .where("circuitBreaker.key", "=", key)
            .select(["circuitBreaker.data"])
            .executeTakeFirst();
        if (row === undefined) {
            return CIRCUIT_BREAKER_STATE.CLOSED;
        }
        const data = parseCircuitBreakerData(row.data);
        if (data.type !== KyselyCountBreaker.POLICY) {
            return CIRCUIT_BREAKER_STATE.CLOSED;
        }
        return data.state.type;
    }

    async updateState(key: string): Promise<CircuitBreakerStateTransition> {
        const next = this.resolveNextData(Date.now(), Math.random());
        const row = await this.trxCtx.current
            .insertInto("circuitBreaker")
            .values({
                key,
                data: this.resolveEmptyData(),
                lastTransitionFrom: CIRCUIT_BREAKER_STATE.CLOSED,
            })
            .onConflict((oc) =>
                oc.column("key").doUpdateSet({
                    data: next.data,
                    lastTransitionFrom: next.lastTransitionFrom,
                }),
            )
            .returning([
                "circuitBreaker.data",
                "circuitBreaker.lastTransitionFrom",
            ])
            .executeTakeFirstOrThrow();
        const data = parseCircuitBreakerData(row.data);
        if (data.type !== KyselyCountBreaker.POLICY) {
            throw UnexpectedError.create(
                "KyselyCountBreaker stored an unexpected breaker policy",
            );
        }
        return {
            from: (row.lastTransitionFrom ??
                CIRCUIT_BREAKER_STATE.CLOSED) as CircuitBreakerState,
            to: data.state.type,
        };
    }

    async isolate(key: string): Promise<void> {
        const { isCurrent, stateType } = this.resolveColumns();
        const data = KyselyCountBreaker.resolveData(
            KyselyCountBreaker.resolveIsolatedState(this.isPostgres),
            this.isPostgres,
        );
        await this.trxCtx.current
            .insertInto("circuitBreaker")
            .values({
                key,
                data,
                lastTransitionFrom: CIRCUIT_BREAKER_STATE.CLOSED,
            })
            .onConflict((oc) =>
                oc.column("key").doUpdateSet({
                    data,
                    lastTransitionFrom: sql<string>`(case when ${isCurrent} then ${stateType} else ${sql.lit(
                        CIRCUIT_BREAKER_STATE.CLOSED,
                    )} end)`,
                }),
            )
            .execute();
    }

    async trackFailure(key: string): Promise<void> {
        await this.writeTrackedState(key, false);
    }

    async trackSuccess(key: string): Promise<void> {
        await this.writeTrackedState(key, true);
    }

    private async writeTrackedState(
        key: string,
        success: boolean,
    ): Promise<void> {
        const next = this.resolveTrackedData(success);
        await this.trxCtx.current
            .insertInto("circuitBreaker")
            .values({
                key,
                data: this.resolveFreshTrackedData(success),
                lastTransitionFrom: CIRCUIT_BREAKER_STATE.CLOSED,
            })
            .onConflict((oc) =>
                oc.column("key").doUpdateSet({
                    data: next.data,
                    lastTransitionFrom: next.lastTransitionFrom,
                }),
            )
            .execute();
    }

    async reset(key: string): Promise<void> {
        await this.trxCtx.current
            .deleteFrom("circuitBreaker")
            .where("circuitBreaker.key", "=", key)
            .execute();
    }
}
