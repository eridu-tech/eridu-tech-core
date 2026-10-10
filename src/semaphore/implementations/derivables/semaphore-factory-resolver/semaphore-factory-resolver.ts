/**
 * @module Semaphore
 */
import { SemaphoreFactory } from "@/semaphore/implementations/derivables/semaphore-factory/_module.js";
import {
    DefaultAdapterNotDefinedError,
    UnregisteredAdapterError,
} from "@/utilities/_module-exports.js";

import type {
    ISemaphoreFactoryResolver,
    ISemaphoreFactory,
    ISemaphoreAdapter,
} from "@/semaphore/contracts/_module-exports.js";
import type { SemaphoreFactorySettingsBase } from "@/semaphore/implementations/derivables/semaphore-factory/_module.js";
import type { IInitizable } from "@/utilities/_module-exports.js";

/**
 * IMPORT_PATH: `"eridu-tech/semaphore"`
 * @group Derivables
 */
export type SemaphoreAdapters<TAdapters extends string> = Partial<
    Record<TAdapters, ISemaphoreAdapter>
>;

/**
 * Configuration for `SemaphoreFactoryResolver`.
 * Registers named semaphore adapters and optionally designates a default.
 *
 * IMPORT_PATH: `"eridu-tech/semaphore"`
 * @group Derivables
 */
export type SemaphoreFactoryResolverSettings<TAdapters extends string> =
    SemaphoreFactorySettingsBase & {
        /**
         * Named registry of semaphore adapters. Each key is an adapter alias and the corresponding value is the adapter instance.
         */
        adapters: SemaphoreAdapters<TAdapters>;

        /**
         * The alias of the adapter to use when none is explicitly specified. Must be a key in the `adapters` map.
         */
        defaultAdapter?: NoInfer<TAdapters>;
    };

/**
 * The `SemaphoreFactoryResolver` class is immutable.
 *
 * IMPORT_PATH: `"eridu-tech/semaphore"`
 * @group Derivables
 */
export class SemaphoreFactoryResolver<TAdapters extends string>
    implements ISemaphoreFactoryResolver<TAdapters>, IInitizable
{
    constructor(
        private readonly settings: SemaphoreFactoryResolverSettings<TAdapters>,
    ) {}

    private readonly factories = {} as Partial<
        Record<TAdapters, SemaphoreFactory>
    >;

    async init(): Promise<void> {
        const { adapters, ...rest } = this.settings;
        for (const adapterName in adapters) {
            const adapter = this.settings.adapters[adapterName];
            if (adapter === undefined) {
                continue;
            }
            const factory = new SemaphoreFactory({
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
    ): ISemaphoreFactory {
        if (adapterName === undefined) {
            throw new DefaultAdapterNotDefinedError(
                SemaphoreFactory.name,
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
