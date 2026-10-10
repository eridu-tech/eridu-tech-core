/**
 * @module Lock
 */
import { LockFactory } from "@/lock/implementations/derivables/lock-factory/_module.js";
import {
    DefaultAdapterNotDefinedError,
    UnregisteredAdapterError,
} from "@/utilities/_module-exports.js";

import type {
    ILockFactoryResolver,
    ILockFactory,
    ILockAdapter,
} from "@/lock/contracts/_module-exports.js";
import type { LockFactorySettingsBase } from "@/lock/implementations/derivables/lock-factory/_module.js";
import type { IInitizable } from "@/utilities/_module-exports.js";

/**
 * IMPORT_PATH: `"eridu-tech/lock"`
 * @group Derivables
 */
export type LockAdapters<TAdapters extends string> = Partial<
    Record<TAdapters, ILockAdapter>
>;

/**
 * Configuration for `LockFactoryResolver`.
 * Registers named lock adapters and optionally designates a default.
 *
 * IMPORT_PATH: `"eridu-tech/lock"`
 * @group Derivables
 */
export type LockFactoryResolverSettings<TAdapters extends string> =
    LockFactorySettingsBase & {
        /**
         * Named registry of lock adapters. Each key is an adapter alias and the corresponding value is the adapter instance.
         */
        adapters: LockAdapters<TAdapters>;

        /**
         * The alias of the adapter to use when none is explicitly specified. Must be a key in the `adapters` map.
         */
        defaultAdapter?: NoInfer<TAdapters>;
    };

/**
 * The `LockFactoryResolver` class is immutable.
 *
 * IMPORT_PATH: `"eridu-tech/lock"`
 * @group Derivables
 */
export class LockFactoryResolver<TAdapters extends string>
    implements ILockFactoryResolver<TAdapters>, IInitizable
{
    constructor(
        private readonly settings: LockFactoryResolverSettings<TAdapters>,
    ) {}

    private readonly factories = {} as Partial<Record<TAdapters, LockFactory>>;

    async init(): Promise<void> {
        const { adapters, ...rest } = this.settings;
        for (const adapterName in adapters) {
            const adapter = this.settings.adapters[adapterName];
            if (adapter === undefined) {
                continue;
            }
            const factory = new LockFactory({
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
    ): ILockFactory {
        if (adapterName === undefined) {
            throw new DefaultAdapterNotDefinedError(
                LockFactory.name,
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
