/**
 * @module CircuitBreaker
 */

import {
    BACKOFFS,
    serializeBackoffSettingsEnum,
} from "@/backoff-policies/implementations/_module-exports.js";
import { BREAKER_POLICIES } from "@/circuit-breaker/contracts/_module-exports.js";
import { serializeCircuitBreakerPolicySettingsEnum } from "@/circuit-breaker/implementations/adapters/_shared/_module.js";
import { MongodbConsecutiveBreaker } from "@/circuit-breaker/implementations/adapters/mongodb-circuit-breaker-adapter/mongodb-consecutive-breaker.js";
import { MongodbCountBreaker } from "@/circuit-breaker/implementations/adapters/mongodb-circuit-breaker-adapter/mongodb-count-breaker.js";
import { MongodbSamplingBreaker } from "@/circuit-breaker/implementations/adapters/mongodb-circuit-breaker-adapter/mongodb-sampling-breaker.js";
import { resolveTransactionAware } from "@/transaction-context/implementations/derivables/_module-exports.js";

import type { ClientSession, Collection, CollectionOptions, Db } from "mongodb";

import type {
    BackoffSettingsEnum,
    SerializedBackoffSettingsEnum,
} from "@/backoff-policies/implementations/_module-exports.js";
import type {
    CircuitBreakerPolicySettingsEnum,
    CircuitBreakerState,
    CircuitBreakerStateTransition,
    ICircuitBreakerAdapter,
} from "@/circuit-breaker/contracts/_module-exports.js";
import type { SerializedCircuitBreakerPolicySettingsEnum } from "@/circuit-breaker/implementations/adapters/_shared/_module.js";
import type { MongodbCircuitBreakerEntryDocument } from "@/circuit-breaker/implementations/adapters/mongodb-circuit-breaker-adapter/mongodb-circuit-breaker-entry-document.js";
import type {
    ITransactionConnection,
    TransactionAware,
} from "@/transaction-context/contracts/_module-exports.js";
import type {
    IAsyncDeinitizable,
    IAsyncInitizable,
} from "@/utilities/_module-exports.js";

/**
 * Configuration for `MongodbCircuitBreakerAdapter`.
 * Requires a MongoDB `Db` instance or a `TransactionContext`.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/mongodb-circuit-breaker-adapter"`
 * @group Adapters
 */
export type MongodbCircuitBreakerAdapterSettings = {
    /**
     * The MongoDB `Db` or `TransactionContext` used to store circuit breaker state.
     *
     * Pass a `TransactionContext` instance to make the adapter transaction aware. Adapters given the same instance share the same transaction.
     */
    database: TransactionAware<Db, ClientSession>;

    /**
     * Name of the MongoDB collection used to store circuit breaker entries.
     * @default "circuitBreaker"
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
     * You can choose between different types of predefined circuit breaker policies.
     * @default
     * ```ts
     * { type: BREAKER_POLICIES.CONSECUTIVE, failureThreshold: 5 }
     * ```
     */
    circuitBreakerPolicy?: CircuitBreakerPolicySettingsEnum;
};

/**
 * To utilize the `MongodbCircuitBreakerAdapter`, you must install the [`"mongodb"`](https://www.npmjs.com/package/mongodb) package.
 *
 * Call `init` once before using the adapter, and `deInit` to remove the collection and its indexes.
 *
 * Every method performs a single collection call and never starts a transaction, so the
 * adapter takes part in the surrounding transaction when one is active.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/mongodb-circuit-breaker-adapter"`
 * @group Adapters
 */
export class MongodbCircuitBreakerAdapter
    implements ICircuitBreakerAdapter, IAsyncInitizable, IAsyncDeinitizable
{
    private readonly adapter: ICircuitBreakerAdapter;
    private readonly trxCtx: Pick<
        ITransactionConnection<Db, ClientSession>,
        "client" | "transaction"
    >;
    private readonly collection: Collection<MongodbCircuitBreakerEntryDocument>;

    constructor(settings: MongodbCircuitBreakerAdapterSettings) {
        const {
            database,
            collectionName = "circuitBreaker",
            collectionSettings,
            backoffPolicy = { type: BACKOFFS.EXPONENTIAL },
            circuitBreakerPolicy = {
                type: BREAKER_POLICIES.CONSECUTIVE,
                failureThreshold: 5,
            },
        } = settings;
        this.trxCtx = resolveTransactionAware(database);
        this.collection = this.trxCtx.client.collection(
            collectionName,
            collectionSettings,
        );
        this.adapter = this.selectBreaker(
            serializeCircuitBreakerPolicySettingsEnum(circuitBreakerPolicy),
            serializeBackoffSettingsEnum(backoffPolicy),
        );
    }

    private selectBreaker(
        circuitBreakerPolicy: Required<SerializedCircuitBreakerPolicySettingsEnum>,
        backoffPolicy: Required<SerializedBackoffSettingsEnum>,
    ): ICircuitBreakerAdapter {
        if (circuitBreakerPolicy.type === BREAKER_POLICIES.CONSECUTIVE) {
            return new MongodbConsecutiveBreaker(
                circuitBreakerPolicy,
                backoffPolicy,
                this.collection,
                this.trxCtx,
            );
        }
        if (circuitBreakerPolicy.type === BREAKER_POLICIES.SAMPLING) {
            return new MongodbSamplingBreaker(
                circuitBreakerPolicy,
                backoffPolicy,
                this.collection,
                this.trxCtx,
            );
        }
        return new MongodbCountBreaker(
            circuitBreakerPolicy,
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
    }

    /**
     * Removes the collection where the circuit breaker keys are stored and all it's related indexes.
     * Note all circuit breaker data will be removed.
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
     * Returns the stored state for `key`, or `CLOSED` when nothing is stored yet.
     */
    getState(key: string): Promise<CircuitBreakerState> {
        return this.adapter.getState(key);
    }

    /**
     * Evaluates the breaker policy for `key` and returns the resulting transition.
     */
    updateState(key: string): Promise<CircuitBreakerStateTransition> {
        return this.adapter.updateState(key);
    }

    /**
     * Records a failure for `key`.
     */
    trackFailure(key: string): Promise<void> {
        return this.adapter.trackFailure(key);
    }

    /**
     * Records a success for `key`.
     */
    trackSuccess(key: string): Promise<void> {
        return this.adapter.trackSuccess(key);
    }

    /**
     * Forces `key` into the `ISOLATED` state.
     */
    isolate(key: string): Promise<void> {
        return this.adapter.isolate(key);
    }

    /**
     * Removes the stored state for `key`.
     */
    reset(key: string): Promise<void> {
        return this.adapter.reset(key);
    }
}
