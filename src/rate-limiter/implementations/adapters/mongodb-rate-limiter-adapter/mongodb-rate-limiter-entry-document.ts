/**
 * @module RateLimiter
 */

import type { ObjectId } from "mongodb";

import type {
    AllRateLimiterState,
    FixedWindowLimiterMetrics,
    LIMITER_POLICIES,
    SlidingWindowLimiterMetrics,
} from "@/rate-limiter/contracts/_module-exports.js";

/**
 * Stored sliding-window limiter state.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/mongodb-rate-limiter-adapter"`
 * @group Adapters
 */
export type SlidingWindowLimiterStateEnum = {
    type: (typeof LIMITER_POLICIES)["SLIDING_WINDOW"];
    state: AllRateLimiterState<SlidingWindowLimiterMetrics>;
};

/**
 * Stored fixed-window limiter state.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/mongodb-rate-limiter-adapter"`
 * @group Adapters
 */
export type FixedWindowLimiterStateEnum = {
    type: (typeof LIMITER_POLICIES)["FIXED_WINDOW"];
    state: AllRateLimiterState<FixedWindowLimiterMetrics>;
};

/**
 * Stored state of whichever limiter policy the adapter was configured with.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/mongodb-rate-limiter-adapter"`
 * @group Adapters
 */
export type RateLimiterStateEnum =
    SlidingWindowLimiterStateEnum | FixedWindowLimiterStateEnum;

/**
 * Shape of a rate-limiter document stored in the MongoDB collection.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/mongodb-rate-limiter-adapter"`
 * @group Adapters
 */
export type MongodbRateLimiterEntryDocument = {
    _id: ObjectId;
    /**
     * Unique identifier for the rate limiter entry.
     */
    key: string;

    data: RateLimiterStateEnum;

    /**
     * Date at which the entry is removed by the TTL index.
     */
    expiration: Date;
};
