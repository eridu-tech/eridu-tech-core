/**
 * @module Cache
 */

import { Cache } from "@/cache/implementations/derivables/cache/_module.js";
import {
    DefaultAdapterNotDefinedError,
    UnregisteredAdapterError,
} from "@/utilities/_module-exports.js";

import type { StandardSchemaV1 } from "@standard-schema/spec";

import type {
    ICache,
    ICacheAdapter,
    ICacheResolver,
} from "@/cache/contracts/_module-exports.js";
import type {
    CacheSettings,
    CacheSettingsBase,
} from "@/cache/implementations/derivables/cache/_module.js";
import type { ITimeSpan } from "@/time-span/contracts/_module-exports.js";

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
 * The `CacheResolver` class is immutable.
 *
 * IMPORT_PATH: `"eridu-tech/cache"`
 * @group Derivables
 */
export class CacheResolver<
    TAdapters extends string = string,
    TType = unknown,
> implements ICacheResolver<TAdapters, TType> {
    constructor(
        private readonly settings: CacheResolverSettings<TAdapters, TType>,
    ) {}

    setDefaultTtl(ttl: ITimeSpan | null): CacheResolver<TAdapters, TType> {
        return new CacheResolver({
            ...this.settings,
            defaultTtl: ttl,
        });
    }

    setType<TOutputType>(): CacheResolver<TAdapters, TOutputType> {
        return new CacheResolver<TAdapters, TOutputType>(
            this.settings as CacheResolverSettings<TAdapters, TOutputType>,
        );
    }

    setSchema<TOutputType>(
        schema: StandardSchemaV1<TOutputType>,
    ): CacheResolver<TAdapters, TOutputType> {
        return new CacheResolver({
            ...this.settings,
            schema,
        } as CacheResolverSettings<TAdapters, TOutputType>);
    }

    use(
        adapterName: TAdapters | undefined = this.settings.defaultAdapter,
    ): ICache<TType> {
        if (adapterName === undefined) {
            throw new DefaultAdapterNotDefinedError(
                CacheResolver.name,
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
        return new Cache({
            ...this.settings,
            adapter,
        } as CacheSettings<TType>);
    }
}
