/**
 * @module RateLimiter
 */

import { PostgresAdapter } from "kysely";

import {
    BACKOFFS,
    serializeBackoffSettingsEnum,
} from "@/backoff-policies/implementations/_module-exports.js";
import { LIMITER_POLICIES } from "@/rate-limiter/contracts/_module-exports.js";
import {
    serializeFixedWindowLimiterSettings,
    serializeSlidingWindowLimiterSettings,
} from "@/rate-limiter/implementations/adapters/_shared/_module.js";
import { KyselyFixedWindowLimiter } from "@/rate-limiter/implementations/adapters/kysely-rate-limiter-adapter/kysely-fixed-window-limiter.js";
import { KyselySlidingWindowLimiter } from "@/rate-limiter/implementations/adapters/kysely-rate-limiter-adapter/kysely-sliding-window-limiter.js";
import { resolveTransactionAware } from "@/transaction-context/implementations/derivables/_module-exports.js";

import type { Kysely } from "kysely";

import type {
    BackoffSettingsEnum,
    SerializedBackoffSettingsEnum,
} from "@/backoff-policies/implementations/_module-exports.js";
import type {
    IRateLimiterAdapter,
    IRateLimiterAdapterState,
    RateLimiterPolicySettingsEnum,
} from "@/rate-limiter/contracts/_module-exports.js";
import type { KyselyRateLimiterTables } from "@/rate-limiter/implementations/adapters/kysely-rate-limiter-adapter/kysely-rate-limiter-entry-document.js";
import type {
    ITransactionContext,
    TransactionAware,
} from "@/transaction-context/contracts/_module-exports.js";
import type {
    IAsyncDeinitizable,
    IAsyncInitizable,
} from "@/utilities/_module-exports.js";

/**
 * Configuration for `KyselyRateLimiterAdapter`.
 * Requires a Kysely `Kysely` instance or a `TransactionContext`.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/kysely-rate-limiter-adapter"`
 * @group Adapters
 */
export type KyselyRateLimiterAdapterSettings = {
    /**
     * The Kysely instance or `TransactionContext` used to store rate-limiter state.
     *
     * Pass a `TransactionContext` instance to make the adapter transaction aware. Adapters given the same instance share the same transaction.
     */
    database: TransactionAware<Kysely<KyselyRateLimiterTables>>;

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
 * To utilize the `KyselyRateLimiterAdapter`, you must install the [`"kysely"`](https://www.npmjs.com/package/kysely) package and configure a `Kysely` class instance.
 *
 * Call `init` once before using the adapter, and `deInit` to remove the table and its index.
 * The adapter have been tested with `sqlite` and `postgres` databases.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/kysely-rate-limiter-adapter"`
 * @group Adapters
 */
export class KyselyRateLimiterAdapter
    implements IRateLimiterAdapter, IAsyncInitizable, IAsyncDeinitizable
{
    private readonly adapter: IRateLimiterAdapter;
    private readonly trxCtx: Pick<ITransactionContext<
        Kysely<KyselyRateLimiterTables>
    >, "client" | "current">;
    private readonly isPostgres: boolean;

    constructor(settings: KyselyRateLimiterAdapterSettings) {
        const {
            database,
            backoffPolicy = { type: BACKOFFS.EXPONENTIAL },
            rateLimiterPolicy = { type: LIMITER_POLICIES.FIXED_WINDOW },
        } = settings;
        this.trxCtx = resolveTransactionAware(database);
        this.isPostgres =
            this.trxCtx.client.getExecutor().adapter instanceof PostgresAdapter;
        this.adapter = this.selectLimiter(
            rateLimiterPolicy,
            serializeBackoffSettingsEnum(backoffPolicy),
        );
    }

    private selectLimiter(
        rateLimiterPolicy: RateLimiterPolicySettingsEnum,
        backoffPolicy: Required<SerializedBackoffSettingsEnum>,
    ): IRateLimiterAdapter {
        if (rateLimiterPolicy.type === LIMITER_POLICIES.FIXED_WINDOW) {
            return new KyselyFixedWindowLimiter(
                serializeFixedWindowLimiterSettings(rateLimiterPolicy),
                backoffPolicy,
                this.trxCtx,
                this.isPostgres,
            );
        }
        return new KyselySlidingWindowLimiter(
            serializeSlidingWindowLimiterSettings(rateLimiterPolicy),
            backoffPolicy,
            this.trxCtx,
            this.isPostgres,
        );
    }

    /**
     * Creates the rate limiter table and its expiration index.
     * Note the `init` method needs to be called once before using the adapter.
     */
    async init(): Promise<void> {
        // Should throw if the table already exists thats why the try catch is used.
        try {
            await this.trxCtx.client.schema
                .createTable("rateLimiter")
                .addColumn("key", "varchar(255)", (col) =>
                    col.primaryKey().notNull(),
                )
                .addColumn("data", this.isPostgres ? "jsonb" : "json", (col) =>
                    col.notNull(),
                )
                .addColumn("expiration", "bigint")
                .execute();
        } catch {
            /* EMPTY */
        }

        // Should throw if the index already exists thats why the try catch is used.
        try {
            await this.trxCtx.client.schema
                .createIndex("rateLimiter_expiration")
                .on("rateLimiter")
                .column("expiration")
                .execute();
        } catch {
            /* EMPTY */
        }
    }

    /**
     * Removes the rate limiter table and its index.
     * Note all rate-limiter data will be removed.
     */
    async deInit(): Promise<void> {
        // Should throw if the index does not exists thats why the try catch is used.
        try {
            await this.trxCtx.client.schema
                .dropIndex("rateLimiter_expiration")
                .on("rateLimiter")
                .execute();
        } catch {
            /* EMPTY */
        }

        // Should throw if the table does not exists thats why the try catch is used.
        try {
            await this.trxCtx.client.schema.dropTable("rateLimiter").execute();
        } catch {
            /* EMPTY */
        }
    }

    /**
     * Returns the stored state for `key`, or `null` when no unexpired row exists.
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
