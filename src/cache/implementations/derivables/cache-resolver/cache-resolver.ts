/**
 * @module Cache
 */

import { Cache } from "@/cache/implementations/derivables/cache/_module.js";
import {
    DefaultAdapterNotDefinedError,
    UnregisteredAdapterError,
} from "@/utilities/_module-exports.js";

import type {
    ICache,
    ICacheAdapter,
    ICacheResolver,
} from "@/cache/contracts/_module-exports.js";
import type { CacheSettingsBase } from "@/cache/implementations/derivables/cache/_module.js";
import type { IInitizable } from "@/utilities/_module-exports.js";

/**
 * IMPORT_PATH: `"eridu-tech/cache"`
 * @group Derivables
 */
export type CacheAdapters<
    TAdapters extends string = string,
    TType = unknown,
> = Partial<Record<TAdapters, ICacheAdapter<TType>>>;

/**
 * Configuration for `CacheResolver`.
 * Registers named cache adapters with optional schema validation and designates a default.
 *
 * IMPORT_PATH: `"eridu-tech/cache"`
 * @group Derivables
 */
export type CacheResolverSettings<
    TAdapters extends string = string,
    TType = unknown,
> = CacheSettingsBase & {
    /**
     * Named registry of cache adapters. Each key is an adapter alias and the corresponding value is the adapter instance.
     */
    adapters: CacheAdapters<TAdapters, TType>;

    /**
     * The alias of the adapter to use when none is explicitly specified. Must be a key in the `adapters` map.
     */
    defaultAdapter?: NoInfer<TAdapters>;
};

/**
 * IMPORT_PATH: `"eridu-tech/cache"`
 * @group Derivables
 */
export class CacheResolver<TAdapters extends string = string, TType = unknown>
    implements ICacheResolver<TAdapters, TType>, IInitizable
{
    constructor(
        private readonly settings: CacheResolverSettings<TAdapters, TType>,
    ) {}

    private readonly factories = {} as Partial<Record<TAdapters, Cache<TType>>>;

    async init(): Promise<void> {
        const { adapters, ...rest } = this.settings;
        for (const adapterName in adapters) {
            const adapter = this.settings.adapters[adapterName];
            if (adapter === undefined) {
                continue;
            }
            const factory = new Cache({
                ...rest,
                adapter,
            });
            this.factories[adapterName] = factory as Cache<TType>;
        }
        return Promise.resolve();
    }

    use(
        adapterName: TAdapters | undefined = this.settings.defaultAdapter,
    ): ICache<TType> {
        if (adapterName === undefined) {
            throw DefaultAdapterNotDefinedError.create(
                Cache.name,
                Object.keys(this.settings.adapters),
            );
        }
        const cache = this.factories[adapterName];
        if (cache === undefined) {
            throw new UnregisteredAdapterError(
                adapterName,
                Object.keys(this.settings.adapters),
            );
        }
        return cache;
    }
}
