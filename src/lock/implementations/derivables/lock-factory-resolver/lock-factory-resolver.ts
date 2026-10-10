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
import type { ITimeSpan } from "@/time-span/contracts/_module-exports.js";
import type { Invocable } from "@/utilities/_module-exports.js";

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
export class LockFactoryResolver<
    TAdapters extends string,
> implements ILockFactoryResolver<TAdapters> {
    constructor(
        private readonly settings: LockFactoryResolverSettings<TAdapters>,
    ) {}

    setCreateLockId(
        createId: Invocable<[], string>,
    ): LockFactoryResolver<TAdapters> {
        return new LockFactoryResolver({
            ...this.settings,
            createLockId: createId,
        });
    }

    setDefaultTtl(ttl: ITimeSpan | null): LockFactoryResolver<TAdapters> {
        return new LockFactoryResolver({
            ...this.settings,
            defaultTtl: ttl,
        });
    }

    setDefaultRefreshTime(time: ITimeSpan): LockFactoryResolver<TAdapters> {
        return new LockFactoryResolver({
            ...this.settings,
            defaultRefreshTime: time,
        });
    }

    use(
        adapterName: TAdapters | undefined = this.settings.defaultAdapter,
    ): ILockFactory {
        if (adapterName === undefined) {
            throw new DefaultAdapterNotDefinedError(
                LockFactoryResolver.name,
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
        return new LockFactory({
            ...this.settings,
            adapter,
            serializationId: adapterName,
        });
    }
}
