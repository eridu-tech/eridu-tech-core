/**
 * @module RateLimiter
 */

import {
    BACKOFFS,
    serializeBackoffSettingsEnum,
} from "@/backoff-policies/implementations/_module-exports.js";
import { LIMITER_POLICIES } from "@/rate-limiter/contracts/_module-exports.js";
import {
    serializeFixedWindowLimiterSettings,
    serializeSlidingWindowLimiterSettings,
} from "@/rate-limiter/implementations/adapters/_shared/_module.js";
import { MongodbFixedWindowLimiter } from "@/rate-limiter/implementations/adapters/mongodb-rate-limiter-adapter/mongodb-fixed-window-limiter.js";
import { MongodbSlidingWindowLimiter } from "@/rate-limiter/implementations/adapters/mongodb-rate-limiter-adapter/mongodb-sliding-window-limiter.js";
import { resolveTransactionAware } from "@/transaction-context/implementations/derivables/_module-exports.js";

import type { ClientSession, Collection, CollectionOptions, Db } from "mongodb";

import type {
    BackoffSettingsEnum,
    SerializedBackoffSettingsEnum,
} from "@/backoff-policies/implementations/_module-exports.js";
import type {
    IRateLimiterAdapter,
    IRateLimiterAdapterState,
    RateLimiterPolicySettingsEnum,
} from "@/rate-limiter/contracts/_module-exports.js";
import type { MongodbRateLimiterEntryDocument } from "@/rate-limiter/implementations/adapters/mongodb-rate-limiter-adapter/mongodb-rate-limiter-entry-document.js";
import type {
    ITransactionConnection,
    TransactionAware,
} from "@/transaction-context/contracts/_module-exports.js";
import type {
    IAsyncDeinitizable,
    IAsyncInitizable,
} from "@/utilities/_module-exports.js";

/**
 * Configuration for `MongdobRateLimiter`.
 * Requires a MongoDB `Db` instance or a `TransactionContext`.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/mongodb-rate-limiter-adapter"`
 * @group Adapters
 */
export type MongodbRateLimiterSettings = {
    /**
     * The MongoDB `Db` or `TransactionContext` used to store rate-limiter state.
     *
     * Pass a `TransactionContext` instance to make the adapter transaction aware. Adapters given the same instance share the same transaction.
     */
    database: TransactionAware<Db, ClientSession>;

    /**
     * Name of the MongoDB collection used to store rate-limiter entries.
     * @default "rateLimiter"
     */
    collectionName?: string;

    /**
     * Additional options passed when creating or accessing the MongoDB collection.
     */
    collectionSettings?: CollectionOptions;

    /**
     * You can choose between different types of predefined backoff policies.
     * @default
     * ```ts
     * { type: BACKOFFS.EXPONENTIAL }
     * ```
     */
    backoffPolicy?: BackoffSettingsEnum;

    /**
     * You can choose between different types of predefined rate limiter policies.
     * @default
     * ```ts
     * { type: LIMITER_POLICIES.FIXED_WINDOW }
     * ```
     */
    rateLimiterPolicy?: RateLimiterPolicySettingsEnum;
};

/**
 * To utilize the `MongdobRateLimiter`, you must install the [`"mongodb"`](https://www.npmjs.com/package/mongodb) package.
 *
 * Call `init` once before using the adapter, and `deInit` to remove the collection and its indexes.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/mongodb-rate-limiter-adapter"`
 * @group Adapters
 */
export class MongdobRateLimiter
    implements IRateLimiterAdapter, IAsyncInitizable, IAsyncDeinitizable
{
    private readonly adapter: IRateLimiterAdapter;
    private readonly trxCtx: Pick<
        ITransactionConnection<Db, ClientSession>,
        "client" | "transaction"
    >;
    private readonly collection: Collection<MongodbRateLimiterEntryDocument>;

    constructor(settings: MongodbRateLimiterSettings) {
        const {
            database,
            collectionName = "rateLimiter",
            collectionSettings,
            backoffPolicy = { type: BACKOFFS.EXPONENTIAL },
            rateLimiterPolicy = { type: LIMITER_POLICIES.FIXED_WINDOW },
        } = settings;
        this.trxCtx = resolveTransactionAware(database);
        this.collection = this.trxCtx.client.collection(
            collectionName,
            collectionSettings,
        );
        this.adapter = this.selectLimiter(
            rateLimiterPolicy,
            serializeBackoffSettingsEnum(backoffPolicy),
        );
    }

    private selectLimiter(
        rateLimiterPolicy: RateLimiterPolicySettingsEnum,
        backoffPolicy: SerializedBackoffSettingsEnum,
    ): IRateLimiterAdapter {
        if (rateLimiterPolicy.type === LIMITER_POLICIES.FIXED_WINDOW) {
            return new MongodbFixedWindowLimiter(
                serializeFixedWindowLimiterSettings(rateLimiterPolicy),
                backoffPolicy,
                this.collection,
                this.trxCtx,
            );
        }
        return new MongodbSlidingWindowLimiter(
            serializeSlidingWindowLimiterSettings(rateLimiterPolicy),
            backoffPolicy,
            this.collection,
            this.trxCtx,
        );
    }

    /**
     * Creates all related indexes.
     * Note the `init` method needs to be called once before using the adapter.
     */
    async init(): Promise<void> {
        // Should throw if the index already exists thats why the try catch is used.
        try {
            await this.collection.createIndex(
                {
                    key: 1,
                },
                {
                    unique: true,
                },
            );
        } catch {
            /* EMPTY */
        }

        // Should throw if the index already exists thats why the try catch is used.
        try {
            await this.collection.createIndex("expiration", {
                expireAfterSeconds: 0,
            });
        } catch {
            /* EMPTY */
        }
    }

    /**
     * Removes the collection where the rate-limiter keys are stored and all it's related indexes.
     * Note all rate-limiter data will be removed.
     */
    async deInit(): Promise<void> {
        // Should throw if the collection already does not exists thats why the try catch is used.
        try {
            await this.collection.dropIndexes();
        } catch {
            /* EMPTY */
        }

        // Should throw if the collection already does not exists thats why the try catch is used.
        try {
            await this.collection.drop();
        } catch {
            /* EMPTY */
        }
    }

    /**
     * Returns the stored state for `key`, or `null` when no unexpired entry exists.
     */
    getState(key: string): Promise<IRateLimiterAdapterState | null> {
        return this.adapter.getState(key);
    }

    /**
     * Records an attempt for `key` and returns the resulting state.
     *
     * The attempt is blocked once `limit` attempts have been reached within the
     * configured window; blocked attempts are retried according to the backoff policy.
     */
    updateState(key: string, limit: number): Promise<IRateLimiterAdapterState> {
        return this.adapter.updateState(key, limit);
    }

    /**
     * Removes the stored state for `key`.
     */
    reset(key: string): Promise<void> {
        return this.adapter.reset(key);
    }
}
