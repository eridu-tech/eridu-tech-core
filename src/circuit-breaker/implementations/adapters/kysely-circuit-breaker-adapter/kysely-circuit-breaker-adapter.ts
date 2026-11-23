/**
 * @module CircuitBreaker
 */

import { PostgresAdapter } from "kysely";

import {
    BACKOFFS,
    serializeBackoffSettingsEnum,
} from "@/backoff-policies/implementations/_module-exports.js";
import { BREAKER_POLICIES } from "@/circuit-breaker/contracts/_module-exports.js";
import { serializeCircuitBreakerPolicySettingsEnum } from "@/circuit-breaker/implementations/adapters/_shared/_module.js";
import { KyselyConsecutiveBreaker } from "@/circuit-breaker/implementations/adapters/kysely-circuit-breaker-adapter/kysely-consecutive-breaker.js";
import { KyselyCountBreaker } from "@/circuit-breaker/implementations/adapters/kysely-circuit-breaker-adapter/kysely-count-breaker.js";
import { KyselySamplingBreaker } from "@/circuit-breaker/implementations/adapters/kysely-circuit-breaker-adapter/kysely-sampling-breaker.js";
import { resolveTransactionAware } from "@/transaction-context/implementations/derivables/_module-exports.js";

import type { Kysely } from "kysely";

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
import type { KyselyCircuitBreakerTables } from "@/circuit-breaker/implementations/adapters/kysely-circuit-breaker-adapter/kysely-circuit-breaker-tables.js";
import type {
    ITransactionContext,
    TransactionAware,
} from "@/transaction-context/contracts/_module-exports.js";
import type {
    IAsyncDeinitizable,
    IAsyncInitizable,
} from "@/utilities/_module-exports.js";

/**
 * Configuration for `KyselyCircuitBreakerAdapter`.
 * Requires a Kysely `Kysely` instance or a `TransactionContext`.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/kysely-circuit-breaker-adapter"`
 * @group Adapters
 */
export type KyselyCircuitBreakerAdapterSettings = {
    /**
     * The Kysely instance or `TransactionContext` used to store circuit breaker state.
     *
     * Pass a `TransactionContext` instance to make the adapter transaction aware. Adapters given the same instance share the same transaction.
     */
    database: TransactionAware<Kysely<KyselyCircuitBreakerTables>>;

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
 * To utilize the `KyselyCircuitBreakerAdapter`, you must install the [`"kysely"`](https://www.npmjs.com/package/kysely) package and configure a `Kysely` class instance.
 *
 * Call `init` once before using the adapter, and `deInit` to remove the table.
 * The adapter have been tested with `sqlite` and `postgres` databases.
 *
 * Every method is a single statement and never starts a transaction, so the adapter
 * takes part in the surrounding transaction when one is active.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/kysely-circuit-breaker-adapter"`
 * @group Adapters
 */
export class KyselyCircuitBreakerAdapter
    implements ICircuitBreakerAdapter, IAsyncInitizable, IAsyncDeinitizable
{
    private readonly adapter: ICircuitBreakerAdapter;
    private readonly trxCtx: Pick<
        ITransactionContext<Kysely<KyselyCircuitBreakerTables>>,
        "client" | "current"
    >;
    private readonly isPostgres: boolean;

    constructor(settings: KyselyCircuitBreakerAdapterSettings) {
        const {
            database,
            backoffPolicy = { type: BACKOFFS.EXPONENTIAL },
            circuitBreakerPolicy = {
                type: BREAKER_POLICIES.CONSECUTIVE,
                failureThreshold: 5,
            },
        } = settings;
        this.trxCtx = resolveTransactionAware(database);
        this.isPostgres =
            this.trxCtx.client.getExecutor().adapter instanceof PostgresAdapter;
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
            return new KyselyConsecutiveBreaker(
                circuitBreakerPolicy,
                backoffPolicy,
                this.trxCtx,
                this.isPostgres,
            );
        }
        if (circuitBreakerPolicy.type === BREAKER_POLICIES.SAMPLING) {
            return new KyselySamplingBreaker(
                circuitBreakerPolicy,
                backoffPolicy,
                this.trxCtx,
                this.isPostgres,
            );
        }
        return new KyselyCountBreaker(
            circuitBreakerPolicy,
            backoffPolicy,
            this.trxCtx,
            this.isPostgres,
        );
    }

    /**
     * Creates the circuit breaker table.
     * Note the `init` method needs to be called once before using the adapter.
     */
    async init(): Promise<void> {
        // Should throw if the table already exists thats why the try catch is used.
        try {
            await this.trxCtx.client.schema
                .createTable("circuitBreaker")
                .addColumn("key", "varchar(255)", (col) =>
                    col.primaryKey().notNull(),
                )
                .addColumn("data", this.isPostgres ? "jsonb" : "json", (col) =>
                    col.notNull(),
                )
                .addColumn("lastTransitionFrom", "varchar(255)")
                .execute();
        } catch {
            /* EMPTY */
        }
    }

    /**
     * Removes the circuit breaker table.
     * Note all circuit breaker data will be removed.
     */
    async deInit(): Promise<void> {
        // Should throw if the table does not exists thats why the try catch is used.
        try {
            await this.trxCtx.client.schema
                .dropTable("circuitBreaker")
                .execute();
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
