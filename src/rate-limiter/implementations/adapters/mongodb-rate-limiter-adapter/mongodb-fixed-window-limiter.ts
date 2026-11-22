/**
 * @module RateLimiter
 */

import { BACKOFFS } from "@/backoff-policies/implementations/_module-exports.js";
import { LIMITER_POLICIES } from "@/rate-limiter/contracts/_module-exports.js";
import { resolveFixedWindowLimiterSettings } from "@/rate-limiter/implementations/adapters/_shared/_module.js";
import { TO_MILLISECONDS } from "@/time-span/contracts/_module-exports.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";
import { UnexpectedError } from "@/utilities/_module-exports.js";

import type { ClientSession, Collection, Db, Document } from "mongodb";

import type { SerializedBackoffSettingsEnum } from "@/backoff-policies/implementations/_module-exports.js";
import type {
    IRateLimiterAdapter,
    IRateLimiterAdapterState,
} from "@/rate-limiter/contracts/_module-exports.js";
import type { SerializedFixedWindowLimiterSettings } from "@/rate-limiter/implementations/adapters/_shared/_module.js";
import type {
    FixedWindowLimiterStateEnum,
    MongodbRateLimiterEntryDocument,
} from "@/rate-limiter/implementations/adapters/mongodb-rate-limiter-adapter/mongodb-rate-limiter-entry-document.js";
import type { ITransactionConnection } from "@/transaction-context/contracts/_module-exports.js";

/**
 * @internal
 */
type ResolvedBackoffSettings = Required<SerializedBackoffSettingsEnum>;

/**
 * @internal
 */
export class MongodbFixedWindowLimiter implements IRateLimiterAdapter {
    private static resolveDelayExpression(
        settings: ResolvedBackoffSettings,
        attemptExpression: string,
    ): Document | number {
        if (settings.type === BACKOFFS.CONSTANT) {
            return settings.delay;
        }
        if (settings.type === BACKOFFS.EXPONENTIAL) {
            return {
                $min: [
                    settings.maxDelay,
                    {
                        $multiply: [
                            settings.minDelay,
                            { $pow: [settings.multiplier, attemptExpression] },
                        ],
                    },
                ],
            };
        }
        if (settings.type === BACKOFFS.LINEAR) {
            return {
                $min: [
                    settings.maxDelay,
                    { $multiply: [settings.minDelay, attemptExpression] },
                ],
            };
        }
        return {
            $min: [
                settings.maxDelay,
                {
                    $multiply: [
                        settings.minDelay,
                        { $pow: [attemptExpression, settings.degree] },
                    ],
                },
            ],
        };
    }

    private static toAdapterState(
        state: FixedWindowLimiterStateEnum,
        expiration: Date,
    ): IRateLimiterAdapterState {
        const { attempt, blocked } = state.values;
        return {
            success: blocked === null,
            attempt: blocked === null ? attempt : blocked.attempt,
            resetTime: expiration,
        };
    }

    private readonly window: number;

    constructor(
        private readonly limiterPolicy: SerializedFixedWindowLimiterSettings,
        private readonly backoffPolicy: SerializedBackoffSettingsEnum,
        private readonly collection: Collection<MongodbRateLimiterEntryDocument>,
        private readonly trxCtx: Pick<
            ITransactionConnection<Db, ClientSession>,
            "transaction"
        >,
    ) {
        const { window } = resolveFixedWindowLimiterSettings(
            this.limiterPolicy.window === undefined
                ? {}
                : {
                      window: TimeSpan.fromMilliseconds(
                          this.limiterPolicy.window,
                      ),
                  },
        );
        this.window = window[TO_MILLISECONDS]();
    }

    private getDelayExpression(
        attemptExpression: string,
        randomValue: number,
    ): Document | number {
        const settings = this.backoffPolicy as ResolvedBackoffSettings;
        const delay = MongodbFixedWindowLimiter.resolveDelayExpression(
            settings,
            attemptExpression,
        );
        const { jitter } = settings;
        if (jitter === null) {
            return delay;
        }
        return {
            $multiply: [delay, 1 - jitter * randomValue],
        };
    }

    private getUpdateStatePipeline(
        key: string,
        limit: number,
        currentDate: Date,
        randomValue: number,
    ): Array<Document> {
        const now = currentDate.getTime();
        const isCurrent = {
            $and: [
                { $eq: ["$state.type", LIMITER_POLICIES.FIXED_WINDOW] },
                { $ne: ["$expiration", null] },
                { $gt: ["$expiration", currentDate] },
            ],
        };
        const isBlocked = {
            $ne: [{ $ifNull: ["$state.values.blocked", null] }, null],
        };
        const isBlockingNow = {
            $and: ["$__isCurrent", "$__isBlocked", "$__isStillBlocked"],
        };
        return [
            {
                $set: {
                    key,
                    __isCurrent: isCurrent,
                    __isBlocked: isBlocked,
                    __nextBlockedAttempt: {
                        $add: [
                            { $ifNull: ["$state.values.blocked.attempt", 0] },
                            1,
                        ],
                    },
                },
            },
            {
                $set: {
                    __isStillBlocked: {
                        $gt: [
                            {
                                $add: [
                                    {
                                        $ifNull: [
                                            "$state.values.blocked.startedAt",
                                            0,
                                        ],
                                    },
                                    this.getDelayExpression(
                                        "$__nextBlockedAttempt",
                                        randomValue,
                                    ),
                                ],
                            },
                            now,
                        ],
                    },
                    __nextAttempt: {
                        $cond: [
                            {
                                $and: [
                                    "$__isCurrent",
                                    { $not: ["$__isBlocked"] },
                                ],
                            },
                            {
                                $add: [
                                    {
                                        $ifNull: ["$state.values.attempt", 0],
                                    },
                                    1,
                                ],
                            },
                            1,
                        ],
                    },
                },
            },
            {
                $set: {
                    __isBlockedState: {
                        $or: [
                            isBlockingNow,
                            { $gt: ["$__nextAttempt", limit] },
                        ],
                    },
                },
            },
            {
                $set: {
                    __attempt: {
                        $cond: [
                            "$__isBlockedState",
                            {
                                $cond: [
                                    isBlockingNow,
                                    "$__nextBlockedAttempt",
                                    1,
                                ],
                            },
                            "$__nextAttempt",
                        ],
                    },
                },
            },
            {
                $set: {
                    state: {
                        type: LIMITER_POLICIES.FIXED_WINDOW,
                        values: {
                            attempt: {
                                $cond: ["$__isBlockedState", 0, "$__attempt"],
                            },
                            lastAttemptAt: now,
                            blocked: {
                                $cond: [
                                    "$__isBlockedState",
                                    {
                                        attempt: "$__attempt",
                                        startedAt: {
                                            $cond: [
                                                isBlockingNow,
                                                "$state.values.blocked.startedAt",
                                                now,
                                            ],
                                        },
                                    },
                                    null,
                                ],
                            },
                        },
                    },
                    expiration: {
                        $cond: [
                            "$__isBlockedState",
                            {
                                $add: [
                                    currentDate,
                                    this.getDelayExpression(
                                        "$__attempt",
                                        randomValue,
                                    ),
                                ],
                            },
                            { $add: [currentDate, this.window] },
                        ],
                    },
                },
            },
            {
                $unset: [
                    "__isCurrent",
                    "__isBlocked",
                    "__nextBlockedAttempt",
                    "__isStillBlocked",
                    "__nextAttempt",
                    "__isBlockedState",
                    "__attempt",
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
        const { state } = document;
        if (state.type !== LIMITER_POLICIES.FIXED_WINDOW) {
            return null;
        }
        return MongodbFixedWindowLimiter.toAdapterState(
            state,
            document.expiration,
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
                "MongodbFixedWindowLimiter failed to update the rate limiter state",
            );
        }
        const { state } = document;
        if (state.type !== LIMITER_POLICIES.FIXED_WINDOW) {
            throw UnexpectedError.create(
                "MongodbFixedWindowLimiter stored an unexpected limiter policy",
            );
        }
        return MongodbFixedWindowLimiter.toAdapterState(
            state,
            document.expiration,
        );
    }

    async reset(key: string): Promise<void> {
        await this.collection.deleteOne(
            { key },
            { session: this.trxCtx.transaction ?? undefined },
        );
    }
}
