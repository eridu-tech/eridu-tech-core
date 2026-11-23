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
    ConsecutiveBreakerSettingsEnum,
    ICircuitBreakerAdapter,
} from "@/circuit-breaker/contracts/_module-exports.js";
import type { KyselyCircuitBreakerTables } from "@/circuit-breaker/implementations/adapters/kysely-circuit-breaker-adapter/kysely-circuit-breaker-entry-document.js";
import type { ITransactionConnection } from "@/transaction-context/contracts/_module-exports.js";

/**
 * The consecutive breaker stored in a sql table: the breaker breaks after n failed
 * calls in a row.
 *
 * Every method is a single statement and joins the transaction of the surrounding
 * transaction context when one is active.
 *
 * @internal
 */
export class KyselyConsecutiveBreaker implements ICircuitBreakerAdapter {
    private static readonly POLICY = BREAKER_POLICIES.CONSECUTIVE;
    private static readonly COLUMN = "circuitBreaker.data";

    private static resolveMetrics(
        failureCount: RawBuilder<number>,
        successCount: RawBuilder<number>,
        isPostgres: boolean,
    ): RawBuilder<string> {
        return resolveJsonObjectExpression(
            [
                ["failureCount", failureCount],
                ["successCount", successCount],
            ],
            isPostgres,
        );
    }

    private static resolveClosedState(
        failureCount: RawBuilder<number>,
        successCount: RawBuilder<number>,
        isPostgres: boolean,
    ): RawBuilder<string> {
        return resolveJsonObjectExpression(
            [
                ["type", sql.lit(CIRCUIT_BREAKER_STATE.CLOSED)],
                [
                    "metrics",
                    KyselyConsecutiveBreaker.resolveMetrics(
                        failureCount,
                        successCount,
                        isPostgres,
                    ),
                ],
            ],
            isPostgres,
        );
    }

    private static resolveHalfOpenState(
        attempt: RawBuilder<number>,
        failureCount: RawBuilder<number>,
        successCount: RawBuilder<number>,
        isPostgres: boolean,
    ): RawBuilder<string> {
        return resolveJsonObjectExpression(
            [
                ["type", sql.lit(CIRCUIT_BREAKER_STATE.HALF_OPEN)],
                ["attempt", attempt],
                [
                    "metrics",
                    KyselyConsecutiveBreaker.resolveMetrics(
                        failureCount,
                        successCount,
                        isPostgres,
                    ),
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
                ["type", sql.lit(KyselyConsecutiveBreaker.POLICY)],
                ["state", state],
            ],
            isPostgres,
        );
    }

    constructor(
        private readonly circuitBreakerPolicy: Required<ConsecutiveBreakerSettingsEnum>,
        private readonly backoffPolicy: Required<SerializedBackoffSettingsEnum>,
        private readonly trxCtx: Pick<
            ITransactionConnection<Kysely<KyselyCircuitBreakerTables>>,
            "current"
        >,
        private readonly isPostgres: boolean,
    ) {}

    private get failureThreshold(): number {
        return this.circuitBreakerPolicy.failureThreshold;
    }

    private get successThreshold(): number {
        return this.circuitBreakerPolicy.successThreshold;
    }

    private resolveInitialData(): RawBuilder<string> {
        return KyselyConsecutiveBreaker.resolveData(
            KyselyConsecutiveBreaker.resolveClosedState(
                resolveNumberLiteral(0),
                resolveNumberLiteral(0),
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
        return KyselyConsecutiveBreaker.resolveData(
            KyselyConsecutiveBreaker.resolveClosedState(
                resolveNumberLiteral(success ? 0 : 1),
                resolveNumberLiteral(0),
                this.isPostgres,
            ),
            this.isPostgres,
        );
    }

    private resolveColumns(): {
        isCurrent: RawBuilder<boolean>;
        stateType: RawBuilder<string | null>;
        failureCount: RawBuilder<number | null>;
        successCount: RawBuilder<number | null>;
        attempt: RawBuilder<number | null>;
        startedAt: RawBuilder<number | null>;
    } {
        const { isPostgres } = this;
        const column = KyselyConsecutiveBreaker.COLUMN;
        const type = resolveJsonTextExpression(column, ["type"], isPostgres);
        const stateType = resolveJsonTextExpression(
            column,
            ["state", "type"],
            isPostgres,
        );
        return {
            isCurrent: sql<boolean>`(${type} = ${sql.lit(
                KyselyConsecutiveBreaker.POLICY,
            )} and ${stateType} is not null)`,
            stateType,
            failureCount: resolveJsonNumberExpression(
                column,
                ["state", "metrics", "failureCount"],
                isPostgres,
            ),
            successCount: resolveJsonNumberExpression(
                column,
                ["state", "metrics", "successCount"],
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
        const {
            isCurrent,
            stateType,
            failureCount,
            successCount,
            attempt,
            startedAt,
        } = this.resolveColumns();
        const nowLiteral = resolveNumberLiteral(now);
        const closed = KyselyConsecutiveBreaker.resolveClosedState(
            resolveIntegerExpression(
                sql<number>`coalesce(${failureCount}, 0)`,
                isPostgres,
            ),
            resolveIntegerExpression(
                sql<number>`coalesce(${successCount}, 0)`,
                isPostgres,
            ),
            isPostgres,
        );
        const open = KyselyConsecutiveBreaker.resolveOpenState(
            resolveIntegerExpression(
                sql<number>`coalesce(${attempt}, 0)`,
                isPostgres,
            ),
            resolveIntegerExpression(
                sql<number>`coalesce(${startedAt}, ${nowLiteral})`,
                isPostgres,
            ),
            isPostgres,
        );
        const reopened = KyselyConsecutiveBreaker.resolveOpenState(
            resolveNumberLiteral(1),
            nowLiteral,
            isPostgres,
        );
        const halfOpened = KyselyConsecutiveBreaker.resolveHalfOpenState(
            resolveIntegerExpression(
                sql<number>`coalesce(${attempt}, 0)`,
                isPostgres,
            ),
            resolveNumberLiteral(0),
            resolveNumberLiteral(0),
            isPostgres,
        );
        const isWaitTimeOver = sql<boolean>`(coalesce(${startedAt}, ${nowLiteral}) + ${resolveBackoffDelayExpression(
            this.backoffPolicy,
            resolveIntegerExpression(
                sql<number>`coalesce(${attempt}, 0)`,
                isPostgres,
            ),
            randomValue,
            isPostgres,
        )} <= ${nowLiteral})`;
        const closedTransition = sql`(case when coalesce(${failureCount}, 0) >= ${resolveNumberLiteral(
            this.failureThreshold,
        )} then ${reopened} else ${closed} end)`;
        const openTransition = sql`(case when ${isWaitTimeOver} then ${halfOpened} else ${open} end)`;
        const halfOpenTransition = sql`(case when coalesce(${failureCount}, 0) > 0 then ${KyselyConsecutiveBreaker.resolveOpenState(
            resolveIntegerExpression(
                sql<number>`coalesce(${attempt}, 0) + 1`,
                isPostgres,
            ),
            nowLiteral,
            isPostgres,
        )} when coalesce(${successCount}, 0) >= ${resolveNumberLiteral(
            this.successThreshold,
        )} then ${KyselyConsecutiveBreaker.resolveClosedState(
            resolveNumberLiteral(0),
            resolveNumberLiteral(0),
            isPostgres,
        )} else ${KyselyConsecutiveBreaker.resolveHalfOpenState(
            resolveIntegerExpression(
                sql<number>`coalesce(${attempt}, 0)`,
                isPostgres,
            ),
            resolveIntegerExpression(
                sql<number>`coalesce(${failureCount}, 0)`,
                isPostgres,
            ),
            resolveIntegerExpression(
                sql<number>`coalesce(${successCount}, 0)`,
                isPostgres,
            ),
            isPostgres,
        )} end)`;
        const state = sql`(case when not ${isCurrent} then ${KyselyConsecutiveBreaker.resolveClosedState(
            resolveNumberLiteral(0),
            resolveNumberLiteral(0),
            isPostgres,
        )} when ${stateType} = ${sql.lit(
            CIRCUIT_BREAKER_STATE.CLOSED,
        )} then ${closedTransition} when ${stateType} = ${sql.lit(
            CIRCUIT_BREAKER_STATE.OPEN,
        )} then ${openTransition} when ${stateType} = ${sql.lit(
            CIRCUIT_BREAKER_STATE.HALF_OPEN,
        )} then ${halfOpenTransition} else ${KyselyConsecutiveBreaker.resolveIsolatedState(
            isPostgres,
        )} end)`;
        return {
            data: KyselyConsecutiveBreaker.resolveData(state, isPostgres),
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
        const {
            isCurrent,
            stateType,
            failureCount,
            successCount,
            attempt,
            startedAt,
        } = this.resolveColumns();
        const trackedFailureCount = resolveIntegerExpression(
            sql<number>`coalesce(${failureCount}, 0) + ${success ? 0 : 1}`,
            isPostgres,
        );
        const trackedSuccessCount = resolveIntegerExpression(
            sql<number>`coalesce(${successCount}, 0) + ${success ? 1 : 0}`,
            isPostgres,
        );
        const closedTracked = success
            ? KyselyConsecutiveBreaker.resolveClosedState(
                  resolveNumberLiteral(0),
                  resolveNumberLiteral(0),
                  isPostgres,
              )
            : KyselyConsecutiveBreaker.resolveClosedState(
                  trackedFailureCount,
                  resolveIntegerExpression(
                      sql<number>`coalesce(${successCount}, 0)`,
                      isPostgres,
                  ),
                  isPostgres,
              );
        const halfOpenTracked = KyselyConsecutiveBreaker.resolveHalfOpenState(
            resolveIntegerExpression(
                sql<number>`coalesce(${attempt}, 0)`,
                isPostgres,
            ),
            success
                ? resolveIntegerExpression(
                      sql<number>`coalesce(${failureCount}, 0)`,
                      isPostgres,
                  )
                : trackedFailureCount,
            success
                ? trackedSuccessCount
                : resolveIntegerExpression(
                      sql<number>`coalesce(${successCount}, 0)`,
                      isPostgres,
                  ),
            isPostgres,
        );
        const open = KyselyConsecutiveBreaker.resolveOpenState(
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
        )} then ${open} else ${KyselyConsecutiveBreaker.resolveIsolatedState(
            isPostgres,
        )} end)`;
        return {
            data: KyselyConsecutiveBreaker.resolveData(state, isPostgres),
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
        if (data.type !== KyselyConsecutiveBreaker.POLICY) {
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
                data: this.resolveInitialData(),
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
        if (data.type !== KyselyConsecutiveBreaker.POLICY) {
            throw UnexpectedError.create(
                "KyselyConsecutiveBreaker stored an unexpected breaker policy",
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
        const data = KyselyConsecutiveBreaker.resolveData(
            KyselyConsecutiveBreaker.resolveIsolatedState(this.isPostgres),
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
