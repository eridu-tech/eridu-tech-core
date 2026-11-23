/**
 * @module CircuitBreaker
 */

import { CIRCUIT_BREAKER_STATE } from "@/circuit-breaker/contracts/_module-exports.js";
import { resolveBackoffDelayExpression } from "@/circuit-breaker/implementations/adapters/mongodb-circuit-breaker-adapter/mongodb-backoff-delay-expression.js";

import type { Document } from "mongodb";

import type { SerializedBackoffSettingsEnum } from "@/backoff-policies/implementations/_module-exports.js";

/**
 * Fields a pipeline uses while it computes the next state. They are removed before the
 * document is persisted, so only `key`, `data` and `lastTransitionFrom` are stored.
 *
 * @internal
 */
export const PIPELINE_TEMP_FIELDS = ["__isCurrent", "__state", "__next"];

/**
 * The current time of the database server in milliseconds. Using it instead of a client
 * clock value keeps the measured wait time independent of the network round trip.
 *
 * @internal
 */
export const SERVER_NOW = { $toLong: "$$NOW" };

/**
 * Resolves the state stored for `key`, falling back to the initial closed state when
 * the document is missing or was written for another breaker policy.
 *
 * @internal
 */
export function resolveStoredStateStages(settings: {
    key: string;
    policyType: string;
    initialMetrics: Document;
}): Array<Document> {
    const { key, policyType, initialMetrics } = settings;
    return [
        {
            $set: {
                key,
                __isCurrent: {
                    $and: [
                        { $eq: ["$data.type", policyType] },
                        { $eq: [{ $type: "$data.state" }, "object"] },
                    ],
                },
            },
        },
        {
            $set: {
                __state: {
                    $cond: [
                        "$__isCurrent",
                        "$data.state",
                        {
                            type: CIRCUIT_BREAKER_STATE.CLOSED,
                            metrics: initialMetrics,
                        },
                    ],
                },
            },
        },
    ];
}

/**
 * Mirrors `CircuitBreakerStateManager.updateState`: transitions a closed state when the
 * breaker policy reports a failure, moves an opened state to half open once the backoff
 * delay measured from `startedAt` has elapsed, and asks the policy about half open states.
 *
 * @internal
 */
export function resolveUpdateStateStage(settings: {
    backoffPolicy: Required<SerializedBackoffSettingsEnum>;
    randomValue: number;
    initialMetrics: Document;
    whenClosed: Document;
    whenHalfOpened: Document;
}): Document {
    const {
        backoffPolicy,
        randomValue,
        initialMetrics,
        whenClosed,
        whenHalfOpened,
    } = settings;
    const isWaitTimeOver = {
        $lte: [
            {
                $add: [
                    "$__state.startedAt",
                    resolveBackoffDelayExpression(
                        backoffPolicy,
                        "$__state.attempt",
                        randomValue,
                    ),
                ],
            },
            SERVER_NOW,
        ],
    };
    return {
        $set: {
            __next: {
                $switch: {
                    branches: [
                        {
                            case: {
                                $eq: [
                                    "$__state.type",
                                    CIRCUIT_BREAKER_STATE.CLOSED,
                                ],
                            },
                            then: {
                                $cond: [
                                    whenClosed,
                                    {
                                        type: CIRCUIT_BREAKER_STATE.OPEN,
                                        attempt: 1,
                                        startedAt: SERVER_NOW,
                                    },
                                    "$__state",
                                ],
                            },
                        },
                        {
                            case: {
                                $eq: [
                                    "$__state.type",
                                    CIRCUIT_BREAKER_STATE.OPEN,
                                ],
                            },
                            then: {
                                $cond: [
                                    isWaitTimeOver,
                                    {
                                        type: CIRCUIT_BREAKER_STATE.HALF_OPEN,
                                        attempt: "$__state.attempt",
                                        metrics: initialMetrics,
                                    },
                                    "$__state",
                                ],
                            },
                        },
                        {
                            case: {
                                $eq: [
                                    "$__state.type",
                                    CIRCUIT_BREAKER_STATE.HALF_OPEN,
                                ],
                            },
                            then: whenHalfOpened,
                        },
                    ],
                    default: "$__state",
                },
            },
        },
    };
}

/**
 * Mirrors `CircuitBreakerStateManager.trackFailure` and `trackSuccess`: metrics are only
 * recorded while the breaker is closed or half open.
 *
 * @internal
 */
export function resolveTrackStateStage(settings: {
    closedMetrics: Document;
    halfOpenMetrics: Document;
}): Document {
    const { closedMetrics, halfOpenMetrics } = settings;
    return {
        $set: {
            __next: {
                $switch: {
                    branches: [
                        {
                            case: {
                                $eq: [
                                    "$__state.type",
                                    CIRCUIT_BREAKER_STATE.CLOSED,
                                ],
                            },
                            then: {
                                type: CIRCUIT_BREAKER_STATE.CLOSED,
                                metrics: closedMetrics,
                            },
                        },
                        {
                            case: {
                                $eq: [
                                    "$__state.type",
                                    CIRCUIT_BREAKER_STATE.HALF_OPEN,
                                ],
                            },
                            then: {
                                type: CIRCUIT_BREAKER_STATE.HALF_OPEN,
                                attempt: "$__state.attempt",
                                metrics: halfOpenMetrics,
                            },
                        },
                    ],
                    default: "$__state",
                },
            },
        },
    };
}

/**
 * Stores the computed state and remembers the state it came from, so a single database
 * call can report both sides of the transition.
 *
 * @internal
 */
export function resolveWriteStage(policyType: string): Document {
    return {
        $set: {
            data: {
                type: policyType,
                state: "$__next",
            },
            lastTransitionFrom: "$__state.type",
        },
    };
}

/**
 * @internal
 */
export function resolveUnsetStage(tempFields: Array<string>): Document {
    return {
        $unset: [...PIPELINE_TEMP_FIELDS, ...tempFields],
    };
}

/**
 * Builds the state expressions a policy reports when it decides to open, close or stay.
 *
 * @internal
 */
export function resolveClosedState(metrics: Document | string): Document {
    return {
        type: CIRCUIT_BREAKER_STATE.CLOSED,
        metrics,
    };
}

/**
 * @internal
 */
export function resolveOpenState(attempt: Document | number): Document {
    return {
        type: CIRCUIT_BREAKER_STATE.OPEN,
        attempt,
        startedAt: SERVER_NOW,
    };
}
