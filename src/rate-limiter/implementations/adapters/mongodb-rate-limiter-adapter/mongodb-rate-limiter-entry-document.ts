/**
 * @module RateLimiter
 */

import type { ObjectId } from "mongodb";

import type { LIMITER_POLICIES } from "@/rate-limiter/contracts/_module-exports.js";
import type { FixedWindowLimiterState } from "@/rate-limiter/implementations/adapters/_shared/fixed-window-limiter-helpers.js";
import type { SlidingWindowLimiterState } from "@/rate-limiter/implementations/adapters/_shared/sliding-window-limiter-helpers.js";

/**
 * Stored sliding-window limiter state.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/mongodb-rate-limiter-adapter"`
 * @group Adapters
 */
export type SlidingWindowLimiterStateEnum = {
    type: (typeof LIMITER_POLICIES)["SLIDING_WINDOW"];
    values: SlidingWindowLimiterState;
};

/**
 * Stored fixed-window limiter state.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/mongodb-rate-limiter-adapter"`
 * @group Adapters
 */
export type FixedWindowLimiterStateEnum = {
    type: (typeof LIMITER_POLICIES)["FIXED_WINDOW"];
    values: FixedWindowLimiterState;
};

/**
 * Stored state of whichever limiter policy the adapter was configured with.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/mongodb-rate-limiter-adapter"`
 * @group Adapters
 */
export type RateLimiterStateEnum =
    SlidingWindowLimiterStateEnum | FixedWindowLimiterState;

/**
 * Shape of a rate-limiter document stored in the MongoDB collection.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/mongodb-rate-limiter-adapter"`
 * @group Adapters
 */
export type MongodbRateLimiterEntryDocument = {
    _id: ObjectId;
    state: RateLimiterStateEnum;
    /**
     * Date at which the entry is removed by the TTL index.
     */
    expiration: Date;
};
