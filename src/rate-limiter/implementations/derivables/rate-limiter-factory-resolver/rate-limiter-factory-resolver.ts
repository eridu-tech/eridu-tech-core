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
import type { IInitizable } from "@/utilities/_module-exports.js";

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
export class RateLimiterFactoryResolver<TAdapters extends string>
    implements IRateLimiterFactoryResolver<TAdapters>, IInitizable
{
    constructor(
        private readonly settings: RateLimiterFactoryResolverSettings<TAdapters>,
    ) {}

    private readonly factories = {} as Partial<
        Record<TAdapters, RateLimiterFactory>
    >;

    async init(): Promise<void> {
        const { adapters, ...rest } = this.settings;
        for (const adapterName in adapters) {
            const adapter = this.settings.adapters[adapterName];
            if (adapter === undefined) {
                continue;
            }
            const factory = new RateLimiterFactory({
                ...rest,
                adapter,
                serializationId: adapterName,
            });
            await factory.init();
            this.factories[adapterName] = factory;
        }
        return Promise.resolve();
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
        const factory = this.factories[adapterName];
        if (factory === undefined) {
            throw new UnregisteredAdapterError(
                adapterName,
                Object.keys(this.settings.adapters),
            );
        }
        return factory;
    }
}
