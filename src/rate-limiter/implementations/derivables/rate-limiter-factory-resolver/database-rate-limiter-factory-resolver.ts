/**
 * @module RateLimiter
 */

import { DatabaseRateLimiterAdapter } from "@/rate-limiter/implementations/adapters/database-rate-limiter-adapter/_module-exports.js";
import { RateLimiterFactory } from "@/rate-limiter/implementations/derivables/rate-limiter-factory/_module.js";
import {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    UnregisteredAdapterError,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    DefaultAdapterNotDefinedError,
} from "@/utilities/_module-exports.js";

import type { BackoffPolicy } from "@/backoff-policies/contracts/_module.js";
import type {
    IRateLimiterFactoryResolver,
    IRateLimiterFactory,
    IRateLimiterStorageAdapter,
    IRateLimiterPolicy,
} from "@/rate-limiter/contracts/_module-exports.js";
import type { RateLimiterFactorySettingsBase } from "@/rate-limiter/implementations/derivables/rate-limiter-factory/_module.js";
import type { ErrorPolicy } from "@/utilities/_module-exports.js";

/**
 * IMPORT_PATH: `"eridu-tech/rate-limiter"`
 * @group Derivables
 */
export type DatabaseRateLimiterAdapters<TAdapters extends string> = Partial<
    Record<TAdapters, IRateLimiterStorageAdapter>
>;

/**
 * Configuration for `DatabaseRateLimiterFactoryResolver`.
 * Convenience resolver that wires named {@link IRateLimiterStorageAdapter | `IRateLimiterStorageAdapter`} database adapters
 * into rate-limiter logic.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter"`
 * @group Derivables
 */
export type DatabaseRateLimiterFactoryResolverSettings<
    TAdapters extends string,
> = RateLimiterFactorySettingsBase & {
    /**
     * Named registry of rate-limiter storage adapters. Each key is an adapter alias and the corresponding value is the adapter instance.
     */
    adapters: DatabaseRateLimiterAdapters<TAdapters>;

    /**
     * The alias of the adapter to use when none is explicitly specified. Must be a key in the `adapters` map.
     */
    defaultAdapter?: NoInfer<TAdapters>;

    /**
     * @default
     * ```ts
     * import { exponentialBackoff } from "eridu-tech/backoff-policies";
     *
     * exponentialBackoff();
     * ```
     */
    backoffPolicy?: BackoffPolicy;

    /**
     * @default
     * ```ts
     * import { ConsecutiveBreaker } from "eridu-tech/rate-limiter/policies";
     *
     * new ConsecutiveBreaker({ failureThreshold: 5 });
     * ```
     */
    rateLimiterPolicy?: IRateLimiterPolicy;
};

/**
 * The `DatabaseRateLimiterFactoryResolver` class is immutable.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter"`
 * @group Derivables
 */
export class DatabaseRateLimiterFactoryResolver<
    TAdapters extends string,
> implements IRateLimiterFactoryResolver<TAdapters> {
    constructor(
        private readonly settings: DatabaseRateLimiterFactoryResolverSettings<TAdapters>,
    ) {}

    setOnlyError(
        onlyError?: boolean,
    ): DatabaseRateLimiterFactoryResolver<TAdapters> {
        return new DatabaseRateLimiterFactoryResolver({
            ...this.settings,
            onlyError,
        });
    }

    setDefaultErrorPolicy(
        errorPolicy: ErrorPolicy,
    ): DatabaseRateLimiterFactoryResolver<TAdapters> {
        return new DatabaseRateLimiterFactoryResolver({
            ...this.settings,
            defaultErrorPolicy: errorPolicy,
        });
    }

    setBackoffPolicy(
        backoffPolicy?: BackoffPolicy,
    ): DatabaseRateLimiterFactoryResolver<TAdapters> {
        return new DatabaseRateLimiterFactoryResolver({
            ...this.settings,
            backoffPolicy,
        });
    }

    setRateLimiterPolicy(
        rateLimiterPolicy?: IRateLimiterPolicy,
    ): DatabaseRateLimiterFactoryResolver<TAdapters> {
        return new DatabaseRateLimiterFactoryResolver({
            ...this.settings,
            rateLimiterPolicy,
        });
    }

    use(
        adapterName: TAdapters | undefined = this.settings.defaultAdapter,
    ): IRateLimiterFactory {
        if (adapterName === undefined) {
            throw new DefaultAdapterNotDefinedError(
                DatabaseRateLimiterFactoryResolver.name,
                Object.keys(this.settings.adapters),
            );
        }
        const adapter = this.settings.adapters[adapterName];
        if (adapter === undefined) {
            throw new UnregisteredAdapterError(
                adapterName,
                Object.keys(this.settings.adapters),
            );
        }
        return new RateLimiterFactory({
            ...this.settings,
            adapter: new DatabaseRateLimiterAdapter({
                adapter,
            }),
        });
    }
}
