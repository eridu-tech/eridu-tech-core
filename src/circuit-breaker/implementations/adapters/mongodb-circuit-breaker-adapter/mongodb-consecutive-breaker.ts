/**
 * @module CircuitBreaker
 */

import {
    BREAKER_POLICIES,
    CIRCUIT_BREAKER_STATE,
} from "@/circuit-breaker/contracts/_module-exports.js";
import {
    resolveClosedState,
    resolveOpenState,
    resolveStoredStateStages,
    resolveTrackStateStage,
    resolveUnsetStage,
    resolveUpdateStateStage,
    resolveWriteStage,
} from "@/circuit-breaker/implementations/adapters/mongodb-circuit-breaker-adapter/mongodb-circuit-breaker-pipeline.js";
import { UnexpectedError } from "@/utilities/_module-exports.js";

import type { ClientSession, Collection, Db, Document } from "mongodb";

import type { SerializedBackoffSettingsEnum } from "@/backoff-policies/implementations/_module-exports.js";
import type {
    CircuitBreakerState,
    CircuitBreakerStateTransition,
    ConsecutiveBreakerMetrics,
    ConsecutiveBreakerSettingsEnum,
    ICircuitBreakerAdapter,
} from "@/circuit-breaker/contracts/_module-exports.js";
import type { MongodbCircuitBreakerEntryDocument } from "@/circuit-breaker/implementations/adapters/mongodb-circuit-breaker-adapter/mongodb-circuit-breaker-entry-document.js";
import type { ITransactionConnection } from "@/transaction-context/contracts/_module-exports.js";

/**
 * The consecutive breaker stored in a MongoDB collection: the breaker breaks after n
 * failed calls in a row.
 *
 * Every method performs exactly one collection call and joins the session of the
 * enclosing transaction when one is active.
 *
 * @internal
 */
export class MongodbConsecutiveBreaker implements ICircuitBreakerAdapter {
    private static readonly POLICY = BREAKER_POLICIES.CONSECUTIVE;

    private static getInitialMetrics(): ConsecutiveBreakerMetrics {
        return {
            failureCount: 0,
            successCount: 0,
        };
    }

    private readonly initialMetrics =
        MongodbConsecutiveBreaker.getInitialMetrics();

    constructor(
        private readonly circuitBreakerPolicy: Required<ConsecutiveBreakerSettingsEnum>,
        private readonly backoffPolicy: Required<SerializedBackoffSettingsEnum>,
        private readonly collection: Collection<MongodbCircuitBreakerEntryDocument>,
        private readonly trxCtx: Pick<
            ITransactionConnection<Db, ClientSession>,
            "transaction"
        >,
    ) {}

    private getUpdateStatePipeline(
        key: string,
        randomValue: number,
    ): Array<Document> {
        const { failureThreshold, successThreshold } =
            this.circuitBreakerPolicy;
        return [
            ...resolveStoredStateStages({
                key,
                policyType: MongodbConsecutiveBreaker.POLICY,
                initialMetrics: this.initialMetrics,
            }),
            resolveUpdateStateStage({
                backoffPolicy: this.backoffPolicy,
                randomValue,
                initialMetrics: this.initialMetrics,
                whenClosed: {
                    $gte: ["$__state.metrics.failureCount", failureThreshold],
                },
                whenHalfOpened: {
                    $cond: [
                        { $gt: ["$__state.metrics.failureCount", 0] },
                        resolveOpenState({
                            $add: ["$__state.attempt", 1],
                        }),
                        {
                            $cond: [
                                {
                                    $gte: [
                                        "$__state.metrics.successCount",
                                        successThreshold,
                                    ],
                                },
                                resolveClosedState(this.initialMetrics),
                                "$__state",
                            ],
                        },
                    ],
                },
            }),
            resolveWriteStage(MongodbConsecutiveBreaker.POLICY),
            resolveUnsetStage([]),
        ];
    }

    private getTrackPipeline(key: string, success: boolean): Array<Document> {
        const countedMetrics = success
            ? {
                  $mergeObjects: [
                      "$__state.metrics",
                      {
                          successCount: {
                              $add: ["$__state.metrics.successCount", 1],
                          },
                      },
                  ],
              }
            : {
                  $mergeObjects: [
                      "$__state.metrics",
                      {
                          failureCount: {
                              $add: ["$__state.metrics.failureCount", 1],
                          },
                      },
                  ],
              };
        return [
            ...resolveStoredStateStages({
                key,
                policyType: MongodbConsecutiveBreaker.POLICY,
                initialMetrics: this.initialMetrics,
            }),
            resolveTrackStateStage({
                closedMetrics: success ? this.initialMetrics : countedMetrics,
                halfOpenMetrics: countedMetrics,
            }),
            resolveWriteStage(MongodbConsecutiveBreaker.POLICY),
            resolveUnsetStage([]),
        ];
    }

    async getState(key: string): Promise<CircuitBreakerState> {
        const document = await this.collection.findOne(
            { key },
            { session: this.trxCtx.transaction ?? undefined },
        );
        if (
            document === null ||
            document.data.type !== MongodbConsecutiveBreaker.POLICY
        ) {
            return CIRCUIT_BREAKER_STATE.CLOSED;
        }
        return document.data.state.type;
    }

    async updateState(key: string): Promise<CircuitBreakerStateTransition> {
        const document = await this.collection.findOneAndUpdate(
            { key },
            this.getUpdateStatePipeline(key, Math.random()),
            {
                upsert: true,
                returnDocument: "after",
                session: this.trxCtx.transaction ?? undefined,
            },
        );
        if (document === null) {
            throw UnexpectedError.create(
                "MongodbConsecutiveBreaker failed to update the circuit breaker state",
            );
        }
        return {
            from: document.lastTransitionFrom ?? CIRCUIT_BREAKER_STATE.CLOSED,
            to: document.data.state.type,
        };
    }

    async isolate(key: string): Promise<void> {
        await this.collection.updateOne(
            { key },
            [
                {
                    $set: {
                        key,
                        data: {
                            type: MongodbConsecutiveBreaker.POLICY,
                            state: {
                                type: CIRCUIT_BREAKER_STATE.ISOLATED,
                            },
                        },
                    },
                },
            ],
            {
                upsert: true,
                session: this.trxCtx.transaction ?? undefined,
            },
        );
    }

    async trackFailure(key: string): Promise<void> {
        await this.collection.updateOne(
            { key },
            this.getTrackPipeline(key, false),
            {
                upsert: true,
                session: this.trxCtx.transaction ?? undefined,
            },
        );
    }

    async trackSuccess(key: string): Promise<void> {
        await this.collection.updateOne(
            { key },
            this.getTrackPipeline(key, true),
            {
                upsert: true,
                session: this.trxCtx.transaction ?? undefined,
            },
        );
    }

    async reset(key: string): Promise<void> {
        await this.collection.deleteOne(
            { key },
            { session: this.trxCtx.transaction ?? undefined },
        );
    }
}
