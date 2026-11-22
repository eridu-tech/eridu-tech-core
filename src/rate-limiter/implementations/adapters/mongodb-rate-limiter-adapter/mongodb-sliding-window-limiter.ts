/**
 * @module RateLimiter
 */

import {
    LIMITER_POLICIES,
    RATE_LIMITER_STATE,
} from "@/rate-limiter/contracts/_module-exports.js";
import {
    resolveSlidingWindowAdapterState,
    resolveSlidingWindowStart,
} from "@/rate-limiter/implementations/adapters/_shared/_module.js";
import { resolveBackoffDelayExpression } from "@/rate-limiter/implementations/adapters/mongodb-rate-limiter-adapter/mongodb-backoff-delay-expression.js";
import { UnexpectedError } from "@/utilities/_module-exports.js";

import type { ClientSession, Collection, Db, Document } from "mongodb";

import type { SerializedBackoffSettingsEnum } from "@/backoff-policies/implementations/_module-exports.js";
import type {
    IRateLimiterAdapter,
    IRateLimiterAdapterState,
} from "@/rate-limiter/contracts/_module-exports.js";
import type { SerializedSlidingWindowLimiterSettings } from "@/rate-limiter/implementations/adapters/_shared/_module.js";
import type { MongodbRateLimiterEntryDocument } from "@/rate-limiter/implementations/adapters/mongodb-rate-limiter-adapter/mongodb-rate-limiter-entry-document.js";
import type { ITransactionConnection } from "@/transaction-context/contracts/_module-exports.js";

/**
 * @internal
 */
export class MongodbSlidingWindowLimiter implements IRateLimiterAdapter {
    /**
     * Builds an expression that reads the attempt count stored for `windowValue`,
     * falling back to `0` when the window has no entry. Entries are keyed by the
     * window start as a string, so `$objectToArray` is used instead of a lookup.
     */
    private static getWindowValueExpression(
        entriesExpression: string,
        windowValue: number,
    ): Document {
        return {
            $ifNull: [
                {
                    $arrayElemAt: [
                        {
                            $map: {
                                input: {
                                    $filter: {
                                        input: entriesExpression,
                                        as: "entry",
                                        cond: {
                                            $eq: [
                                                { $toLong: "$$entry.k" },
                                                windowValue,
                                            ],
                                        },
                                    },
                                },
                                as: "entry",
                                in: "$$entry.v",
                            },
                        },
                        0,
                    ],
                },
                0,
            ],
        };
    }

    constructor(
        private readonly rateLimiterPolicy: Required<SerializedSlidingWindowLimiterSettings>,
        private readonly backoffPolicy: Required<SerializedBackoffSettingsEnum>,
        private readonly collection: Collection<MongodbRateLimiterEntryDocument>,
        private readonly trxCtx: Pick<
            ITransactionConnection<Db, ClientSession>,
            "transaction"
        >,
    ) {}

    private getUpdateStatePipeline(
        key: string,
        limit: number,
        currentDate: Date,
        randomValue: number,
    ): Array<Document> {
        const now = currentDate.getTime();
        const { window, margin } = this.rateLimiterPolicy;
        const currentWindow = resolveSlidingWindowStart(currentDate, window);
        const previousWindow = currentWindow - window;
        const previousWindowFactor = 1 - (now % window) / window;
        const allowedExpiration = new Date(currentWindow + window * 2 + margin);
        const isCurrent = {
            $and: [
                { $eq: ["$data.type", LIMITER_POLICIES.SLIDING_WINDOW] },
                { $ne: ["$expiration", null] },
                { $gt: ["$expiration", currentDate] },
            ],
        };
        const isAllowed = {
            $eq: ["$data.state.type", RATE_LIMITER_STATE.ALLOWED],
        };
        const isTrackedAllowed = {
            $eq: ["$__tracked.type", RATE_LIMITER_STATE.ALLOWED],
        };
        const shouldBlock = {
            $gte: [
                {
                    $add: ["$__currentAttempt", 1, "$__previousAttempt"],
                },
                limit,
            ],
        };
        const isBlockOver = {
            $lte: [
                {
                    $add: [
                        "$__tracked.startedAt",
                        resolveBackoffDelayExpression(
                            this.backoffPolicy,
                            "$__tracked.attempt",
                            randomValue,
                        ),
                    ],
                },
                now,
            ],
        };
        return [
            {
                $set: {
                    key,
                    __isCurrent: isCurrent,
                    __isAllowed: isAllowed,
                },
            },
            {
                $set: {
                    __entries: {
                        $objectToArray: {
                            $cond: [
                                "$__isCurrent",
                                { $ifNull: ["$data.state.metrics", {}] },
                                {},
                            ],
                        },
                    },
                },
            },
            {
                $set: {
                    __currentAttempt:
                        MongodbSlidingWindowLimiter.getWindowValueExpression(
                            "$__entries",
                            currentWindow,
                        ),
                    __previousAttempt: {
                        $floor: {
                            $multiply: [
                                previousWindowFactor,
                                MongodbSlidingWindowLimiter.getWindowValueExpression(
                                    "$__entries",
                                    previousWindow,
                                ),
                            ],
                        },
                    },
                },
            },
            {
                // Mirrors SlidingWindowLimiter.updateMetrics: drop windows older
                // than the previous one.
                $set: {
                    __cleaned: {
                        $filter: {
                            input: "$__entries",
                            as: "entry",
                            cond: {
                                $gte: [
                                    { $toLong: "$$entry.k" },
                                    previousWindow,
                                ],
                            },
                        },
                    },
                },
            },
            {
                // Increments the current window of the cleaned metrics.
                $set: {
                    __updatedMetrics: {
                        $arrayToObject: {
                            $concatArrays: [
                                {
                                    $filter: {
                                        input: "$__cleaned",
                                        as: "entry",
                                        cond: {
                                            $ne: [
                                                { $toLong: "$$entry.k" },
                                                currentWindow,
                                            ],
                                        },
                                    },
                                },
                                [
                                    {
                                        k: { $toString: currentWindow },
                                        v: {
                                            $add: ["$__currentAttempt", 1],
                                        },
                                    },
                                ],
                            ],
                        },
                    },
                },
            },
            {
                // Mirrors InternalRateLimiterPolicy: fall back to the initial
                // metrics when nothing unexpired is stored, then track the attempt.
                $set: {
                    __tracked: {
                        $cond: [
                            {
                                $and: [
                                    "$__isCurrent",
                                    { $not: ["$__isAllowed"] },
                                ],
                            },
                            {
                                type: RATE_LIMITER_STATE.BLOCKED,
                                startedAt: "$data.state.startedAt",
                                attempt: {
                                    $add: [
                                        {
                                            $ifNull: ["$data.state.attempt", 0],
                                        },
                                        1,
                                    ],
                                },
                            },
                            {
                                type: RATE_LIMITER_STATE.ALLOWED,
                                metrics: "$__updatedMetrics",
                            },
                        ],
                    },
                },
            },
            {
                $set: {
                    __isTrackedAllowed: isTrackedAllowed,
                    __shouldBlock: shouldBlock,
                    __isBlockOver: isBlockOver,
                },
            },
            {
                // Mirrors whenAllowed (block on limit) and whenBlocked (reset once
                // the backoff window measured from startedAt has elapsed).
                $set: {
                    __result: {
                        $cond: [
                            "$__isTrackedAllowed",
                            {
                                $cond: [
                                    "$__shouldBlock",
                                    {
                                        type: RATE_LIMITER_STATE.BLOCKED,
                                        attempt: 1,
                                        startedAt: now,
                                    },
                                    "$__tracked",
                                ],
                            },
                            {
                                $cond: [
                                    "$__isBlockOver",
                                    {
                                        type: RATE_LIMITER_STATE.ALLOWED,
                                        metrics: {
                                            [currentWindow]: 0,
                                        },
                                    },
                                    "$__tracked",
                                ],
                            },
                        ],
                    },
                },
            },
            {
                $set: {
                    data: {
                        type: LIMITER_POLICIES.SLIDING_WINDOW,
                        state: "$__result",
                    },
                    expiration: {
                        $cond: [
                            {
                                $eq: [
                                    "$__result.type",
                                    RATE_LIMITER_STATE.ALLOWED,
                                ],
                            },
                            allowedExpiration,
                            {
                                $add: [
                                    currentDate,
                                    resolveBackoffDelayExpression(
                                        this.backoffPolicy,
                                        "$__result.attempt",
                                        randomValue,
                                    ),
                                ],
                            },
                        ],
                    },
                },
            },
            {
                $unset: [
                    "__isCurrent",
                    "__isAllowed",
                    "__entries",
                    "__currentAttempt",
                    "__previousAttempt",
                    "__cleaned",
                    "__updatedMetrics",
                    "__tracked",
                    "__isTrackedAllowed",
                    "__shouldBlock",
                    "__isBlockOver",
                    "__result",
                ],
            },
        ];
    }

    async getState(key: string): Promise<IRateLimiterAdapterState | null> {
        const document = await this.collection.findOne(
            { key },
            { session: this.trxCtx.transaction ?? undefined },
        );
        const currentDate = new Date();
        if (document === null || document.expiration <= currentDate) {
            return null;
        }
        const { data } = document;
        if (data.type !== LIMITER_POLICIES.SLIDING_WINDOW) {
            return null;
        }
        return resolveSlidingWindowAdapterState(
            data,
            document.expiration,
            currentDate,
            this.rateLimiterPolicy.window,
        );
    }

    async updateState(
        key: string,
        limit: number,
    ): Promise<IRateLimiterAdapterState> {
        const currentDate = new Date();
        const document = await this.collection.findOneAndUpdate(
            { key },
            this.getUpdateStatePipeline(key, limit, currentDate, Math.random()),
            {
                upsert: true,
                returnDocument: "after",
                session: this.trxCtx.transaction ?? undefined,
            },
        );
        if (document === null) {
            throw UnexpectedError.create(
                "MongodbSlidingWindowLimiter failed to update the rate limiter state",
            );
        }
        const { data } = document;
        if (data.type !== LIMITER_POLICIES.SLIDING_WINDOW) {
            throw UnexpectedError.create(
                "MongodbSlidingWindowLimiter stored an unexpected limiter policy",
            );
        }
        return resolveSlidingWindowAdapterState(
            data,
            document.expiration,
            currentDate,
            this.rateLimiterPolicy.window,
        );
    }

    async reset(key: string): Promise<void> {
        await this.collection.deleteOne(
            { key },
            { session: this.trxCtx.transaction ?? undefined },
        );
    }
}
