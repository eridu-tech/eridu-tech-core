/**
 * @module CircuitBreaker
 */

import { sql } from "kysely";

import {
    BREAKER_POLICIES,
    CIRCUIT_BREAKER_STATE,
} from "@/circuit-breaker/contracts/_module-exports.js";
import { resolveBackoffDelayExpression } from "@/circuit-breaker/implementations/adapters/kysely-circuit-breaker-adapter/kysely-backoff-delay-expression.js";
import { parseCircuitBreakerData } from "@/circuit-breaker/implementations/adapters/kysely-circuit-breaker-adapter/kysely-circuit-breaker-entry-document.js";
import {
    resolveArrayAppendExpression,
    resolveCeilExpression,
    resolveIncrementLastSampleExpression,
    resolveJsonArrayExpression,
    resolveLastSampleStartedAtExpression,
    resolveSamplesFilterExpression,
    resolveSamplesSumExpression,
} from "@/circuit-breaker/implementations/adapters/kysely-circuit-breaker-adapter/kysely-circuit-breaker-expression.js";
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
    ICircuitBreakerAdapter,
} from "@/circuit-breaker/contracts/_module-exports.js";
import type { SerializedSamplingBreakerSettingsEnum } from "@/circuit-breaker/implementations/adapters/_shared/_module.js";
import type { KyselyCircuitBreakerTables } from "@/circuit-breaker/implementations/adapters/kysely-circuit-breaker-adapter/kysely-circuit-breaker-entry-document.js";
import type { ITransactionConnection } from "@/transaction-context/contracts/_module-exports.js";

/**
 * The sampling breaker stored in a sql table: the breaker breaks after a proportion of
 * the calls made in a time window fail.
 *
 * Every method is a single statement and joins the transaction of the surrounding
 * transaction context when one is active.
 *
 * @internal
 */
export class KyselySamplingBreaker implements ICircuitBreakerAdapter {
    private static readonly POLICY = BREAKER_POLICIES.SAMPLING;
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
                    KyselySamplingBreaker.resolveSamples(samples, isPostgres),
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
                    KyselySamplingBreaker.resolveSamples(samples, isPostgres),
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
                ["type", sql.lit(KyselySamplingBreaker.POLICY)],
                ["state", state],
            ],
            isPostgres,
        );
    }

    constructor(
        private readonly circuitBreakerPolicy: Required<SerializedSamplingBreakerSettingsEnum>,
        private readonly backoffPolicy: Required<SerializedBackoffSettingsEnum>,
        private readonly trxCtx: Pick<
            ITransactionConnection<Kysely<KyselyCircuitBreakerTables>>,
            "current"
        >,
        private readonly isPostgres: boolean,
    ) {}

    /**
     * Mirrors `SamplingBreaker.isMiniumNotMet`.
     */
    private getMinimumNumberOfCalls(): number {
        const { timeSpan, minimumRps } = this.circuitBreakerPolicy;
        return Math.ceil(Math.floor(timeSpan / 1000) * minimumRps);
    }

    private getEmptySamples(): RawBuilder<unknown> {
        if (this.isPostgres) {
            return sql<string>`'[]'::jsonb`;
        }
        return sql<string>`'[]'`;
    }

    private resolveEmptyData(): RawBuilder<string> {
        return KyselySamplingBreaker.resolveData(
            KyselySamplingBreaker.resolveClosedState(
                this.getEmptySamples(),
                this.isPostgres,
            ),
            this.isPostgres,
        );
    }

    private resolveSample(now: number, success: boolean): RawBuilder<string> {
        return resolveJsonObjectExpression(
            [
                ["startedAt", resolveNumberLiteral(now)],
                ["failures", resolveNumberLiteral(success ? 0 : 1)],
                ["successes", resolveNumberLiteral(success ? 1 : 0)],
            ],
            this.isPostgres,
        );
    }

    /**
     * State written when no row exists yet, mirroring `track` applied to the
     * initial metrics.
     */
    private resolveFreshTrackedData(success: boolean): RawBuilder<string> {
        return KyselySamplingBreaker.resolveData(
            KyselySamplingBreaker.resolveClosedState(
                resolveArrayAppendExpression(
                    this.getEmptySamples(),
                    this.resolveSample(Date.now(), success),
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
        const column = KyselySamplingBreaker.COLUMN;
        const type = resolveJsonTextExpression(column, ["type"], isPostgres);
        const stateType = resolveJsonTextExpression(
            column,
            ["state", "type"],
            isPostgres,
        );
        return {
            isCurrent: sql<boolean>`(${type} = ${sql.lit(
                KyselySamplingBreaker.POLICY,
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

    /**
     * Mirrors `CircuitBreakerStateManager.updateState`.
     */
    private resolveNextData(
        now: number,
        randomValue: number,
    ): { data: RawBuilder<string>; lastTransitionFrom: RawBuilder<string> } {
        const { isPostgres } = this;
        const { isCurrent, stateType, samples, attempt, startedAt } =
            this.resolveColumns();
        const { failureThreshold, successThreshold } =
            this.circuitBreakerPolicy;
        const nowLiteral = resolveNumberLiteral(now);
        const minimumNumberOfCalls = this.getMinimumNumberOfCalls();
        const totalFailures = resolveSamplesSumExpression(
            samples,
            "failures",
            isPostgres,
        );
        const totalSuccesses = resolveSamplesSumExpression(
            samples,
            "successes",
            isPostgres,
        );
        const total = sql<number>`(${totalFailures} + ${totalSuccesses})`;
        const attemptExpression = resolveIntegerExpression(
            sql<number>`coalesce(${attempt}, 0)`,
            isPostgres,
        );
        const isMinimumNotMet = sql<boolean>`(${total} < ${resolveNumberLiteral(
            minimumNumberOfCalls,
        )})`;
        const hasFailed = sql<boolean>`(not ${isMinimumNotMet} and ${totalFailures} > ${resolveCeilExpression(
            sql<number>`${resolveNumberLiteral(failureThreshold)} * ${total}`,
            isPostgres,
        )})`;
        const isWaitTimeOver = sql<boolean>`(coalesce(${startedAt}, ${nowLiteral}) + ${resolveBackoffDelayExpression(
            this.backoffPolicy,
            attemptExpression,
            randomValue,
            isPostgres,
        )} <= ${nowLiteral})`;
        const closedTransition = sql`(case when ${hasFailed} then ${KyselySamplingBreaker.resolveOpenState(
            resolveNumberLiteral(1),
            nowLiteral,
            isPostgres,
        )} else ${KyselySamplingBreaker.resolveClosedState(
            samples,
            isPostgres,
        )} end)`;
        const openTransition = sql`(case when ${isWaitTimeOver} then ${KyselySamplingBreaker.resolveHalfOpenState(
            attemptExpression,
            this.getEmptySamples(),
            isPostgres,
        )} else ${KyselySamplingBreaker.resolveOpenState(
            attemptExpression,
            resolveIntegerExpression(
                sql<number>`coalesce(${startedAt}, ${nowLiteral})`,
                isPostgres,
            ),
            isPostgres,
        )} end)`;
        const halfOpenTransition = sql`(case when ${isMinimumNotMet} then ${KyselySamplingBreaker.resolveHalfOpenState(
            attemptExpression,
            samples,
            isPostgres,
        )} when ${totalSuccesses} > ${resolveCeilExpression(
            sql<number>`${resolveNumberLiteral(successThreshold)} * ${total}`,
            isPostgres,
        )} then ${KyselySamplingBreaker.resolveClosedState(
            this.getEmptySamples(),
            isPostgres,
        )} else ${KyselySamplingBreaker.resolveOpenState(
            resolveIntegerExpression(
                sql<number>`${attemptExpression} + 1`,
                isPostgres,
            ),
            nowLiteral,
            isPostgres,
        )} end)`;
        const state = sql`(case when not ${isCurrent} then ${KyselySamplingBreaker.resolveClosedState(
            this.getEmptySamples(),
            isPostgres,
        )} when ${stateType} = ${sql.lit(
            CIRCUIT_BREAKER_STATE.CLOSED,
        )} then ${closedTransition} when ${stateType} = ${sql.lit(
            CIRCUIT_BREAKER_STATE.OPEN,
        )} then ${openTransition} when ${stateType} = ${sql.lit(
            CIRCUIT_BREAKER_STATE.HALF_OPEN,
        )} then ${halfOpenTransition} else ${KyselySamplingBreaker.resolveIsolatedState(
            isPostgres,
        )} end)`;
        return {
            data: KyselySamplingBreaker.resolveData(state, isPostgres),
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
        const { timeSpan, sampleTimeSpan } = this.circuitBreakerPolicy;
        const now = Date.now();
        const keptSamples = resolveSamplesFilterExpression(
            samples,
            { windowStart: now - timeSpan, sampleTimeSpan },
            isPostgres,
        );
        const lastStartedAt = resolveLastSampleStartedAtExpression(
            keptSamples,
            isPostgres,
        );
        const hasSampleEnded = sql<boolean>`(${lastStartedAt} is null or ${lastStartedAt} + ${resolveNumberLiteral(
            sampleTimeSpan,
        )} <= ${resolveNumberLiteral(now)})`;
        const newSample = this.resolveSample(now, success);
        const incrementedSamples = resolveIncrementLastSampleExpression(
            keptSamples,
            success ? "successes" : "failures",
            isPostgres,
        );
        const tracked = sql`(case when ${hasSampleEnded} then ${resolveArrayAppendExpression(
            keptSamples,
            newSample,
            isPostgres,
        )} else ${incrementedSamples} end)`;
        const closedTracked = KyselySamplingBreaker.resolveClosedState(
            tracked,
            isPostgres,
        );
        const halfOpenTracked = KyselySamplingBreaker.resolveHalfOpenState(
            resolveIntegerExpression(
                sql<number>`coalesce(${attempt}, 0)`,
                isPostgres,
            ),
            tracked,
            isPostgres,
        );
        const open = KyselySamplingBreaker.resolveOpenState(
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
        )} then ${open} else ${KyselySamplingBreaker.resolveIsolatedState(
            isPostgres,
        )} end)`;
        return {
            data: KyselySamplingBreaker.resolveData(state, isPostgres),
            lastTransitionFrom: sql<string>`(case when ${isCurrent} then ${stateType} else ${sql.lit(
                CIRCUIT_BREAKER_STATE.CLOSED,
            )} end)`,
        };
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
        if (data.type !== KyselySamplingBreaker.POLICY) {
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
        if (data.type !== KyselySamplingBreaker.POLICY) {
            throw UnexpectedError.create(
                "KyselySamplingBreaker stored an unexpected breaker policy",
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
        const data = KyselySamplingBreaker.resolveData(
            KyselySamplingBreaker.resolveIsolatedState(this.isPostgres),
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
