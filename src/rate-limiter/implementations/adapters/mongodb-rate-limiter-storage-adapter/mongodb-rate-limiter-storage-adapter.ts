/**
 * @module RateLimiter
 */

import type {
    ClientSession,
    Collection,
    CollectionOptions,
    Db,
    ObjectId,
} from "mongodb";

import type {
    IRateLimiterData,
    IRateLimiterStorageAdapter,
    IRateLimiterStorageAdapterTransaction,
} from "@/rate-limiter/contracts/_module.js";
import type { ISerde } from "@/serde/contracts/_module.js";
import type { ITransactionContext } from "@/transaction-context/contracts/_module.js";
import type {
    IDeinitizable,
    IInitizable,
    InvocableFn,
} from "@/utilities/_module.js";

/**
 * Configuration for `MongodbRateLimiterStorageAdapter`.
 * Requires a `TransactionContext`, because its operations must run inside a transaction.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/mongodb-rate-limiter-storage-adapter"`
 * @group Adapters
 */
export type MongodbRateLimiterStorageAdapterSettings = {
    /**
     * The `TransactionContext` used to store rate-limiter state.
     *
     * The adapter is transaction aware: its operations run inside the context's active transaction. Adapters given the same instance share the same transaction.
     */
    transactionContext: ITransactionContext<Db, ClientSession>;
    /**
     * Name of the MongoDB collection used to store rate-limiter state records.
     * @default "rateLimiter"
     */
    collectionName?: string;
    /**
     * Additional options passed when creating or accessing the MongoDB collection.
     */
    collectionSettings?: CollectionOptions;
    /**
     * Serde instance for serializing and deserializing rate-limiter state to and from strings.
     */
    serde: ISerde<string>;
};

/**
 * IMPORT_PATH: `"eridu-tech/rate-limiter/mongodb-rate-limiter-storage-adapter"`
 * @group Adapters
 */
export type MongodbRateLimiterDocument = {
    _id: ObjectId;
    key: string;
    state: string;
    expiration: Date;
};

/**
 * IMPORT_PATH: `"eridu-tech/rate-limiter/mongodb-rate-limiter-storage-adapter"`
 * @group Adapters
 */
export class MongodbRateLimiterStorageAdapter<TType>
    implements IRateLimiterStorageAdapter<TType>, IInitizable, IDeinitizable
{
    private readonly transactionContext: ITransactionContext<Db, ClientSession>;
    private readonly collection: Collection<MongodbRateLimiterDocument>;
    private readonly serde: ISerde<string>;

    /**
     * @example
     * ```ts
     * import { MongodbRateLimiterStorageAdapter } from "eridu-tech/rate-limiter/mongodb-rate-limiter-storage-adapter";
     * import { MongoClient } from "mongodb";
     * import { Serde } from "eridu-tech/serde";
     * import { SuperJsonSerdeAdapter } from "eridu-tech/serde/super-json-serde-adapter"
     *
     * const client = await MongoClient.connect("YOUR_MONGODB_CONNECTION_STRING");
     * const database = client.db("database");
     * const serde = new Serde(new SuperJsonSerdeAdapter());
     * const rateLimiterStorageAdapter = new MongodbRateLimiterStorageAdapter({
     *   client,
     *   database,
     *   serde
     * });
     * // You need initialize the adapter once before using it.
     * await rateLimiterStorageAdapter.init()
     * ```
     */
    constructor(settings: MongodbRateLimiterStorageAdapterSettings) {
        const {
            collectionName = "rateLimiter",
            collectionSettings,
            transactionContext,
            serde,
        } = settings;
        this.transactionContext = transactionContext;
        this.collection = this.transactionContext.client.collection(
            collectionName,
            collectionSettings,
        );
        this.serde = serde;
    }

    /**
     * Removes the collection where the rate limiter keys are stored and all it's related indexes.
     * Note all rate limiter data will be removed.
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

    private async upsert(
        key: string,
        state: TType,
        expiration: Date,
    ): Promise<void> {
        await this.collection.updateOne(
            {
                key,
            },
            {
                $set: {
                    state: this.serde.serialize(state),
                    expiration,
                },
            },
            {
                session: this.transactionContext.transaction ?? undefined,
                upsert: true,
            },
        );
    }

    async transaction<TValue>(
        fn: InvocableFn<
            [transaction: IRateLimiterStorageAdapterTransaction<TType>],
            Promise<TValue>
        >,
    ): Promise<TValue> {
        return await this.transactionContext.run(async () => {
            return await fn({
                upsert: (key, state, expiration) =>
                    this.upsert(key, state, expiration),
                find: (key) => this.find(key),
            });
        });
    }

    async find(key: string): Promise<IRateLimiterData<TType> | null> {
        const doc = await this.collection.findOne(
            {
                key,
            },
            {
                session: this.transactionContext.transaction ?? undefined,
            },
        );
        if (doc === null) {
            return null;
        }
        return {
            state: this.serde.deserialize(doc.state),
            expiration: doc.expiration,
        };
    }

    async remove(key: string): Promise<void> {
        await this.collection.deleteOne(
            {
                key,
            },
            {
                session: this.transactionContext.transaction ?? undefined,
            },
        );
    }
}
