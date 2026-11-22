/**
 * @module RateLimiter
 */

import { BACKOFFS } from "@/backoff-policies/implementations/_module-exports.js";
import { LIMITER_POLICIES } from "@/rate-limiter/contracts/_module-exports.js";
import { resolveTransactionAware } from "@/transaction-context/implementations/derivables/_module-exports.js";

import type {
    ClientSession,
    Collection,
    CollectionOptions,
    Db,
    ObjectId,
} from "mongodb";

import type { BackoffSettingsEnum } from "@/backoff-policies/implementations/_module-exports.js";
import type {
    FixedWindowLimiterSettingsEnum,
    IRateLimiterAdapter,
    IRateLimiterAdapterState,
    RateLimiterPolicySettingsEnum,
    SlidingWindowLimiterSettingsEnum,
} from "@/rate-limiter/contracts/_module-exports.js";
import type { FixedWindowLimiterState } from "@/rate-limiter/implementations/adapters/_shared/fixed-window-limiter-helpers.js";
import type { SlidingWindowLimiterState } from "@/rate-limiter/implementations/adapters/_shared/sliding-window-limiter-helpers.js";
import type {
    ITransactionConnection,
    TransactionAware,
} from "@/transaction-context/contracts/_module-exports.js";
import type {
    IAsyncDeinitizable,
    IAsyncInitizable,
} from "@/utilities/_module-exports.js";

/**
 * @internal
 */
class FixedWindowLimiter implements IRateLimiterAdapter {
    constructor(
        private readonly limiterPolicy: FixedWindowLimiterSettingsEnum,
        private readonly backoffPolicy: BackoffSettingsEnum,
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

/**
 * @internal
 */
class SlidingWindowLimiter implements IRateLimiterAdapter {
    constructor(
        private readonly rateLimiterPolicy: SlidingWindowLimiterSettingsEnum,
        private readonly backoffPolicy: BackoffSettingsEnum,
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
        this.adapter = this.selectLimiter(rateLimiterPolicy, backoffPolicy);
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

    private selectLimiter(
        rateLimiterPolicy: RateLimiterPolicySettingsEnum,
        backoffPolicy: BackoffSettingsEnum,
    ): IRateLimiterAdapter {
        if (rateLimiterPolicy.type === LIMITER_POLICIES.FIXED_WINDOW) {
            return new FixedWindowLimiter(
                rateLimiterPolicy,
                backoffPolicy,
                this.collection,
                this.trxCtx,
            );
        }
        return new SlidingWindowLimiter(
            rateLimiterPolicy,
            backoffPolicy,
            this.collection,
            this.trxCtx,
        );
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
        return this.updateState(key, limit);
    }

    /**
     * Removes the stored state for `key`.
     */
    reset(key: string): Promise<void> {
        return this.reset(key);
    }
}
