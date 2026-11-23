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
    CountBreakerMetrics,
    CountBreakerSettingsEnum,
    ICircuitBreakerAdapter,
} from "@/circuit-breaker/contracts/_module-exports.js";
import type { MongodbCircuitBreakerEntryDocument } from "@/circuit-breaker/implementations/adapters/mongodb-circuit-breaker-adapter/mongodb-circuit-breaker-entry-document.js";
import type { ITransactionConnection } from "@/transaction-context/contracts/_module-exports.js";

/**
 * The count breaker stored in a MongoDB collection: the breaker breaks after a
 * proportion of the calls in a count based sliding window fail.
 *
 * Every method performs exactly one collection call and joins the session of the
 * enclosing transaction when one is active.
 *
 * @internal
 */
export class MongodbCountBreaker implements ICircuitBreakerAdapter {
    private static readonly POLICY = BREAKER_POLICIES.COUNT;
    private static readonly TEMP_FIELDS = [
        "__countingSamples",
        "__currentSamples",
        "__total",
        "__failureCount",
        "__successCount",
        "__newSamples",
    ];

    private static getInitialMetrics(): CountBreakerMetrics {
        return {
            samples: [],
        };
    }

    private static resolveCountingStages(
        samplesExpression: string,
    ): Array<Document> {
        return [
            {
                $set: {
                    __countingSamples: {
                        $ifNull: [samplesExpression, []],
                    },
                },
            },
            {
                $set: {
                    __total: { $size: "$__countingSamples" },
                },
            },
            {
                $set: {
                    __failureCount: {
                        $size: {
                            $filter: {
                                input: "$__countingSamples",
                                as: "isSuccess",
                                cond: { $eq: ["$$isSuccess", false] },
                            },
                        },
                    },
                },
            },
            {
                $set: {
                    __successCount: {
                        $size: {
                            $filter: {
                                input: "$__countingSamples",
                                as: "isSuccess",
                                cond: { $eq: ["$$isSuccess", true] },
                            },
                        },
                    },
                },
            },
        ];
    }

    private readonly initialMetrics = MongodbCountBreaker.getInitialMetrics();

    constructor(
        private readonly circuitBreakerPolicy: Required<CountBreakerSettingsEnum>,
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
        const { failureThreshold, successThreshold, minimumNumberOfCalls } =
            this.circuitBreakerPolicy;
        return [
            ...resolveStoredStateStages({
                key,
                policyType: MongodbCountBreaker.POLICY,
                initialMetrics: this.initialMetrics,
            }),
            ...MongodbCountBreaker.resolveCountingStages(
                "$__state.metrics.samples",
            ),
            resolveUpdateStateStage({
                backoffPolicy: this.backoffPolicy,
                randomValue,
                initialMetrics: this.initialMetrics,
                whenClosed: {
                    $and: [
                        { $gt: ["$__total", minimumNumberOfCalls] },
                        {
                            $gt: [
                                "$__failureCount",
                                {
                                    $ceil: {
                                        $multiply: [
                                            failureThreshold,
                                            "$__total",
                                        ],
                                    },
                                },
                            ],
                        },
                    ],
                },
                whenHalfOpened: {
                    $cond: [
                        { $lte: ["$__total", minimumNumberOfCalls] },
                        "$__state",
                        {
                            $cond: [
                                {
                                    $gte: [
                                        "$__successCount",
                                        {
                                            $ceil: {
                                                $multiply: [
                                                    successThreshold,
                                                    "$__total",
                                                ],
                                            },
                                        },
                                    ],
                                },
                                resolveClosedState(this.initialMetrics),
                                resolveOpenState({
                                    $add: ["$__state.attempt", 1],
                                }),
                            ],
                        },
                    ],
                },
            }),
            resolveWriteStage(MongodbCountBreaker.POLICY),
            resolveUnsetStage(MongodbCountBreaker.TEMP_FIELDS),
        ];
    }

    private getTrackPipeline(key: string, success: boolean): Array<Document> {
        const { size } = this.circuitBreakerPolicy;
        return [
            ...resolveStoredStateStages({
                key,
                policyType: MongodbCountBreaker.POLICY,
                initialMetrics: this.initialMetrics,
            }),
            {
                $set: {
                    __currentSamples: {
                        $ifNull: ["$__state.metrics.samples", []],
                    },
                },
            },
            {
                $set: {
                    __newSamples: {
                        $let: {
                            vars: {
                                concatenated: {
                                    $concatArrays: [
                                        "$__currentSamples",
                                        [success],
                                    ],
                                },
                            },
                            in: {
                                $cond: [
                                    {
                                        $gte: [
                                            {
                                                $size: "$__currentSamples",
                                            },
                                            size,
                                        ],
                                    },
                                    {
                                        $slice: [
                                            "$$concatenated",
                                            1,
                                            {
                                                $size: "$__currentSamples",
                                            },
                                        ],
                                    },
                                    "$$concatenated",
                                ],
                            },
                        },
                    },
                },
            },
            resolveTrackStateStage({
                closedMetrics: { samples: "$__newSamples" },
                halfOpenMetrics: { samples: "$__newSamples" },
            }),
            resolveWriteStage(MongodbCountBreaker.POLICY),
            resolveUnsetStage(MongodbCountBreaker.TEMP_FIELDS),
        ];
    }

    async getState(key: string): Promise<CircuitBreakerState> {
        const document = await this.collection.findOne(
            { key },
            { session: this.trxCtx.transaction ?? undefined },
        );
        if (
            document === null ||
            document.data.type !== MongodbCountBreaker.POLICY
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
                "MongodbCountBreaker failed to update the circuit breaker state",
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
                            type: MongodbCountBreaker.POLICY,
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
