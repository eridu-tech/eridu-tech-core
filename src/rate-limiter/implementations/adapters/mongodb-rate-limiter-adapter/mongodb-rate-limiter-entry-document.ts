/**
 * @module RateLimiter
 */

import type { ObjectId } from "mongodb";

import type { RateLimiterStateEnum } from "@/rate-limiter/contracts/_module-exports.js";

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

    /**
     * Stored state of the configured limiter policy.
     */
    data: RateLimiterStateEnum;

    /**
     * Date at which the entry is removed by the TTL index.
     */
    expiration: Date;
};
