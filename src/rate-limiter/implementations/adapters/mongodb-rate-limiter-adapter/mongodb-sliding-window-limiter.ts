/**
 * @module RateLimiter
 */

import type { ClientSession, Collection, Db } from "mongodb";

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
    constructor(
        private readonly rateLimiterPolicy: Required<SerializedSlidingWindowLimiterSettings>,
        private readonly backoffPolicy: Required<SerializedBackoffSettingsEnum>,
        private readonly collection: Collection<MongodbRateLimiterEntryDocument>,
        private readonly trxCtx: Pick<
            ITransactionConnection<Db, ClientSession>,
            "transaction"
        >,
    ) {}

    getState(key: string): Promise<IRateLimiterAdapterState | null> {
        throw new Error("Method not implemented.");
    }

    updateState(key: string, limit: number): Promise<IRateLimiterAdapterState> {
        throw new Error("Method not implemented.");
    }

    reset(key: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
}
