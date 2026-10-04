/**
 * @module SharedLock
 */
import { SharedLockFactory } from "@/shared-lock/implementations/derivables/shared-lock-factory/_module.js";
import {
    DefaultAdapterNotDefinedError,
    UnregisteredAdapterError,
} from "@/utilities/_module-exports.js";

import type {
    ISharedLockFactoryResolver,
    ISharedLockFactory,
    ISharedLockAdapter,
} from "@/shared-lock/contracts/_module-exports.js";
import type { SharedLockFactorySettingsBase } from "@/shared-lock/implementations/derivables/shared-lock-factory/_module.js";
import type { ITimeSpan } from "@/time-span/contracts/_module-exports.js";
import type { Invocable } from "@/utilities/_module-exports.js";

/**
 * IMPORT_PATH: `"eridu-tech/shared-lock"`
 * @group Derivables
 */
export type SharedLockAdapters<TAdapters extends string> = Partial<
    Record<TAdapters, ISharedLockAdapter>
>;

/**
 * Configuration for `SharedLockFactoryResolver`.
 * Registers named shared-lock adapters and optionally designates a default.
 *
 * IMPORT_PATH: `"eridu-tech/shared-lock"`
 * @group Derivables
 */
export type SharedLockFactoryResolverSettings<TAdapters extends string> =
    SharedLockFactorySettingsBase & {
        /**
         * Named registry of shared-lock adapters. Each key is an adapter alias and the corresponding value is the adapter instance.
         */
        adapters: SharedLockAdapters<TAdapters>;

        /**
         * The alias of the adapter to use when none is explicitly specified. Must be a key in the `adapters` map.
         */
        defaultAdapter?: NoInfer<TAdapters>;
    };

/**
 * The `SharedLockFactoryResolver` class is immutable.
 *
 * IMPORT_PATH: `"eridu-tech/shared-lock"`
 * @group Derivables
 */
export class SharedLockFactoryResolver<
    TAdapters extends string,
> implements ISharedLockFactoryResolver<TAdapters> {
    constructor(
        private readonly settings: SharedLockFactoryResolverSettings<TAdapters>,
    ) {}

    setCreateLockId(
        createId: Invocable<[], string>,
    ): SharedLockFactoryResolver<TAdapters> {
        return new SharedLockFactoryResolver({
            ...this.settings,
            createLockId: createId,
        });
    }

    setDefaultTtl(ttl: ITimeSpan | null): SharedLockFactoryResolver<TAdapters> {
        return new SharedLockFactoryResolver({
            ...this.settings,
            defaultTtl: ttl,
        });
    }

    setDefaultRefreshTime(
        time: ITimeSpan,
    ): SharedLockFactoryResolver<TAdapters> {
        return new SharedLockFactoryResolver({
            ...this.settings,
            defaultRefreshTime: time,
        });
    }

    use(
        adapterName: TAdapters | undefined = this.settings.defaultAdapter,
    ): ISharedLockFactory {
        if (adapterName === undefined) {
            throw new DefaultAdapterNotDefinedError(
                SharedLockFactoryResolver.name,
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
        return new SharedLockFactory({
            ...this.settings,
            adapter,
            serdeTransformerName: adapterName,
        });
    }
}
