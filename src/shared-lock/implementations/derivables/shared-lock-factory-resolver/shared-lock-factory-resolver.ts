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
    ISharedLockAdapter,
    ISharedLockFactory,
} from "@/shared-lock/contracts/_module-exports.js";
import type { SharedLockFactorySettingsBase } from "@/shared-lock/implementations/derivables/shared-lock-factory/_module.js";
import type { IInitizable } from "@/utilities/_module-exports.js";

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
export class SharedLockFactoryResolver<TAdapters extends string>
    implements ISharedLockFactoryResolver<TAdapters>, IInitizable
{
    constructor(
        private readonly settings: SharedLockFactoryResolverSettings<TAdapters>,
    ) {}

    private readonly factories = {} as Partial<
        Record<TAdapters, SharedLockFactory>
    >;

    async init(): Promise<void> {
        const { adapters, ...rest } = this.settings;
        for (const adapterName in adapters) {
            const adapter = this.settings.adapters[adapterName];
            if (adapter === undefined) {
                continue;
            }
            const factory = new SharedLockFactory({
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
    ): ISharedLockFactory {
        if (adapterName === undefined) {
            throw new DefaultAdapterNotDefinedError(
                SharedLockFactory.name,
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
