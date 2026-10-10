/**
 * @module RateLimiter
 */

import { RateLimiterFactory } from "@/rate-limiter/implementations/derivables/rate-limiter-factory/_module.js";
import {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    UnregisteredAdapterError,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    DefaultAdapterNotDefinedError,
} from "@/utilities/_module-exports.js";

import type {
    IRateLimiterFactoryResolver,
    IRateLimiterFactory,
    IRateLimiterAdapter,
} from "@/rate-limiter/contracts/_module-exports.js";
import type { RateLimiterFactorySettingsBase } from "@/rate-limiter/implementations/derivables/rate-limiter-factory/_module.js";
import type { ErrorPolicy } from "@/utilities/_module-exports.js";

/**
 * IMPORT_PATH: `"eridu-tech/rate-limiter"`
 * @group Derivables
 */
export type RateLimiterAdapters<TAdapters extends string> = Partial<
    Record<TAdapters, IRateLimiterAdapter>
>;

/**
 * Configuration for `RateLimiterFactoryResolver`.
 * Registers named rate-limiter adapters and optionally designates a default.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter"`
 * @group Derivables
 */
export type RateLimiterFactoryResolverSettings<TAdapters extends string> =
    RateLimiterFactorySettingsBase & {
        /**
         * Named registry of rate-limiter adapters. Each key is an adapter alias and the corresponding value is the adapter instance.
         */
        adapters: RateLimiterAdapters<TAdapters>;

        /**
         * The alias of the adapter to use when none is explicitly specified. Must be a key in the `adapters` map.
         */
        defaultAdapter?: NoInfer<TAdapters>;
    };

/**
 * The `RateLimiterFactoryResolver` class is immutable.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter"`
 * @group Derivables
 */
export class RateLimiterFactoryResolver<
    TAdapters extends string,
> implements IRateLimiterFactoryResolver<TAdapters> {
    constructor(
        private readonly settings: RateLimiterFactoryResolverSettings<TAdapters>,
    ) {}

    setOnlyError(onlyError?: boolean): RateLimiterFactoryResolver<TAdapters> {
        return new RateLimiterFactoryResolver({
            ...this.settings,
            onlyError,
        });
    }

    setDefaultErrorPolicy(
        errorPolicy: ErrorPolicy,
    ): RateLimiterFactoryResolver<TAdapters> {
        return new RateLimiterFactoryResolver({
            ...this.settings,
            defaultErrorPolicy: errorPolicy,
        });
    }

    use(
        adapterName: TAdapters | undefined = this.settings.defaultAdapter,
    ): IRateLimiterFactory {
        if (adapterName === undefined) {
            throw new DefaultAdapterNotDefinedError(
                RateLimiterFactoryResolver.name,
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
            adapter,
            serializationId: adapterName,
        });
    }
}
