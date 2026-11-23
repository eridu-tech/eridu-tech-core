/**
 * @module CircuitBreaker
 */

import {
    BREAKER_POLICIES,
    CIRCUIT_BREAKER_STATE,
} from "@/circuit-breaker/contracts/_module-exports.js";
import {
    SERVER_NOW,
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
    ICircuitBreakerAdapter,
    SamplingBreakerMetrics,
} from "@/circuit-breaker/contracts/_module-exports.js";
import type { SerializedSamplingBreakerSettingsEnum } from "@/circuit-breaker/implementations/adapters/_shared/_module.js";
import type { MongodbCircuitBreakerEntryDocument } from "@/circuit-breaker/implementations/adapters/mongodb-circuit-breaker-adapter/mongodb-circuit-breaker-entry-document.js";
import type { ITransactionConnection } from "@/transaction-context/contracts/_module-exports.js";

/**
 * The sampling breaker stored in a MongoDB collection: the breaker breaks after a
 * proportion of the calls made in a time window fail.
 *
 * Every method performs exactly one collection call and joins the session of the
 * enclosing transaction when one is active.
 *
 * @internal
 */
export class MongodbSamplingBreaker implements ICircuitBreakerAdapter {
    private static readonly POLICY = BREAKER_POLICIES.SAMPLING;
    private static readonly TEMP_FIELDS = [
        "__countingSamples",
        "__currentSamples",
        "__total",
        "__totalFailures",
        "__totalSuccesses",
        "__windowStart",
        "__keptSamples",
        "__lastSample",
        "__hasSampleEnded",
        "__samples",
    ];

    private static getInitialMetrics(): SamplingBreakerMetrics {
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
                    __totalFailures: {
                        $sum: {
                            $map: {
                                input: "$__countingSamples",
                                as: "sample",
                                in: "$$sample.failures",
                            },
                        },
                    },
                },
            },
            {
                $set: {
                    __totalSuccesses: {
                        $sum: {
                            $map: {
                                input: "$__countingSamples",
                                as: "sample",
                                in: "$$sample.successes",
                            },
                        },
                    },
                },
            },
            {
                $set: {
                    __total: {
                        $add: ["$__totalFailures", "$__totalSuccesses"],
                    },
                },
            },
        ];
    }

    private readonly initialMetrics =
        MongodbSamplingBreaker.getInitialMetrics();

    constructor(
        private readonly circuitBreakerPolicy: Required<SerializedSamplingBreakerSettingsEnum>,
        private readonly backoffPolicy: Required<SerializedBackoffSettingsEnum>,
        private readonly collection: Collection<MongodbCircuitBreakerEntryDocument>,
        private readonly trxCtx: Pick<
            ITransactionConnection<Db, ClientSession>,
            "transaction"
        >,
    ) {}

    /**
     * Mirrors `SamplingBreaker.isMiniumNotMet`.
     */
    private getMinimumNumberOfCalls(): number {
        const { timeSpan, minimumRps } = this.circuitBreakerPolicy;
        return Math.ceil(Math.floor(timeSpan / 1000) * minimumRps);
    }

    private getUpdateStatePipeline(
        key: string,
        randomValue: number,
    ): Array<Document> {
        const { failureThreshold, successThreshold } =
            this.circuitBreakerPolicy;
        const minimumNumberOfCalls = this.getMinimumNumberOfCalls();
        return [
            ...resolveStoredStateStages({
                key,
                policyType: MongodbSamplingBreaker.POLICY,
                initialMetrics: this.initialMetrics,
            }),
            ...MongodbSamplingBreaker.resolveCountingStages(
                "$__state.metrics.samples",
            ),
            resolveUpdateStateStage({
                backoffPolicy: this.backoffPolicy,
                randomValue,
                initialMetrics: this.initialMetrics,
                whenClosed: {
                    $and: [
                        { $gte: ["$__total", minimumNumberOfCalls] },
                        {
                            $gt: [
                                "$__totalFailures",
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
                        { $lt: ["$__total", minimumNumberOfCalls] },
                        "$__state",
                        {
                            $cond: [
                                {
                                    $gt: [
                                        "$__totalSuccesses",
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
            resolveWriteStage(MongodbSamplingBreaker.POLICY),
            resolveUnsetStage(MongodbSamplingBreaker.TEMP_FIELDS),
        ];
    }

    private getTrackPipeline(key: string, success: boolean): Array<Document> {
        const { timeSpan, sampleTimeSpan } = this.circuitBreakerPolicy;
        const increment = success
            ? {
                  successes: { $add: ["$__lastSample.successes", 1] },
              }
            : {
                  failures: { $add: ["$__lastSample.failures", 1] },
              };
        return [
            ...resolveStoredStateStages({
                key,
                policyType: MongodbSamplingBreaker.POLICY,
                initialMetrics: this.initialMetrics,
            }),
            {
                $set: {
                    __windowStart: {
                        $subtract: [SERVER_NOW, timeSpan],
                    },
                },
            },
            {
                $set: {
                    __currentSamples: {
                        $ifNull: ["$__state.metrics.samples", []],
                    },
                },
            },
            {
                $set: {
                    __keptSamples: {
                        $filter: {
                            input: "$__currentSamples",
                            as: "sample",
                            cond: {
                                $gte: [
                                    {
                                        $add: [
                                            "$$sample.startedAt",
                                            sampleTimeSpan,
                                        ],
                                    },
                                    "$__windowStart",
                                ],
                            },
                        },
                    },
                },
            },
            {
                $set: {
                    __lastSample: {
                        $arrayElemAt: ["$__keptSamples", -1],
                    },
                },
            },
            {
                $set: {
                    __hasSampleEnded: {
                        $or: [
                            {
                                $eq: [{ $type: "$__lastSample" }, "missing"],
                            },
                            {
                                $lte: [
                                    {
                                        $add: [
                                            "$__lastSample.startedAt",
                                            sampleTimeSpan,
                                        ],
                                    },
                                    SERVER_NOW,
                                ],
                            },
                        ],
                    },
                },
            },
            {
                $set: {
                    __samples: {
                        $cond: [
                            "$__hasSampleEnded",
                            {
                                $concatArrays: [
                                    "$__keptSamples",
                                    [
                                        {
                                            startedAt: SERVER_NOW,
                                            failures: success ? 0 : 1,
                                            successes: success ? 1 : 0,
                                        },
                                    ],
                                ],
                            },
                            {
                                $map: {
                                    input: {
                                        $range: [
                                            0,
                                            { $size: "$__keptSamples" },
                                        ],
                                    },
                                    as: "index",
                                    in: {
                                        $cond: [
                                            {
                                                $eq: [
                                                    "$$index",
                                                    {
                                                        $subtract: [
                                                            {
                                                                $size: "$__keptSamples",
                                                            },
                                                            1,
                                                        ],
                                                    },
                                                ],
                                            },
                                            {
                                                $mergeObjects: [
                                                    "$__lastSample",
                                                    increment,
                                                ],
                                            },
                                            {
                                                $arrayElemAt: [
                                                    "$__keptSamples",
                                                    "$$index",
                                                ],
                                            },
                                        ],
                                    },
                                },
                            },
                        ],
                    },
                },
            },
            resolveTrackStateStage({
                closedMetrics: { samples: "$__samples" },
                halfOpenMetrics: { samples: "$__samples" },
            }),
            resolveWriteStage(MongodbSamplingBreaker.POLICY),
            resolveUnsetStage(MongodbSamplingBreaker.TEMP_FIELDS),
        ];
    }

    async getState(key: string): Promise<CircuitBreakerState> {
        const document = await this.collection.findOne(
            { key },
            { session: this.trxCtx.transaction ?? undefined },
        );
        if (
            document === null ||
            document.data.type !== MongodbSamplingBreaker.POLICY
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
                "MongodbSamplingBreaker failed to update the circuit breaker state",
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
                            type: MongodbSamplingBreaker.POLICY,
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
