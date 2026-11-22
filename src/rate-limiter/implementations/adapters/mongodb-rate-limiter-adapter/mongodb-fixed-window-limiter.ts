/**
 * @module RateLimiter
 */

import {
    LIMITER_POLICIES,
    RATE_LIMITER_STATE,
} from "@/rate-limiter/contracts/_module-exports.js";
import { resolveFixedWindowAdapterState } from "@/rate-limiter/implementations/adapters/_shared/_module.js";
import { resolveBackoffDelayExpression } from "@/rate-limiter/implementations/adapters/mongodb-rate-limiter-adapter/mongodb-backoff-delay-expression.js";
import { UnexpectedError } from "@/utilities/_module-exports.js";

import type { ClientSession, Collection, Db, Document } from "mongodb";

import type { SerializedBackoffSettingsEnum } from "@/backoff-policies/implementations/_module-exports.js";
import type {
    IRateLimiterAdapter,
    IRateLimiterAdapterState,
} from "@/rate-limiter/contracts/_module-exports.js";
import type { SerializedFixedWindowLimiterSettings } from "@/rate-limiter/implementations/adapters/_shared/_module.js";
import type { MongodbRateLimiterEntryDocument } from "@/rate-limiter/implementations/adapters/mongodb-rate-limiter-adapter/mongodb-rate-limiter-entry-document.js";
import type { ITransactionConnection } from "@/transaction-context/contracts/_module-exports.js";

/**
 * @internal
 */
export class MongodbFixedWindowLimiter implements IRateLimiterAdapter {
    constructor(
        private readonly limiterPolicy: Required<SerializedFixedWindowLimiterSettings>,
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
        const { window } = this.limiterPolicy;
        const isCurrent = {
            $and: [
                { $eq: ["$data.type", LIMITER_POLICIES.FIXED_WINDOW] },
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
            $and: [
                {
                    $lt: [
                        {
                            $subtract: [
                                now,
                                "$__tracked.metrics.lastAttemptAt",
                            ],
                        },
                        window,
                    ],
                },
                { $gt: ["$__tracked.metrics.attempt", limit] },
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
                // Mirrors InternalRateLimiterPolicy: start from the initial metrics
                // when nothing unexpired is stored, then track the attempt.
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
                                metrics: {
                                    attempt: {
                                        $add: [
                                            {
                                                $cond: [
                                                    "$__isCurrent",
                                                    {
                                                        $ifNull: [
                                                            "$data.state.metrics.attempt",
                                                            0,
                                                        ],
                                                    },
                                                    0,
                                                ],
                                            },
                                            1,
                                        ],
                                    },
                                    lastAttemptAt: now,
                                },
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
                                            attempt: 0,
                                            lastAttemptAt: now,
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
                        type: LIMITER_POLICIES.FIXED_WINDOW,
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
                            { $add: [currentDate, window] },
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
        if (document === null || document.expiration <= new Date()) {
            return null;
        }
        const { data } = document;
        if (data.type !== LIMITER_POLICIES.FIXED_WINDOW) {
            return null;
        }
        return resolveFixedWindowAdapterState(data, document.expiration);
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
                "MongodbFixedWindowLimiter failed to update the rate limiter state",
            );
        }
        const { data } = document;
        if (data.type !== LIMITER_POLICIES.FIXED_WINDOW) {
            throw UnexpectedError.create(
                "MongodbFixedWindowLimiter stored an unexpected limiter policy",
            );
        }
        return resolveFixedWindowAdapterState(data, document.expiration);
    }

    async reset(key: string): Promise<void> {
        await this.collection.deleteOne(
            { key },
            { session: this.trxCtx.transaction ?? undefined },
        );
    }
}
