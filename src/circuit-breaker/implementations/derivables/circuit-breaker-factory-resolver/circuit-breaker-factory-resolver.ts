/**
 * @module CircuitBreaker
 */

import { CircuitBreakerFactory } from "@/circuit-breaker/implementations/derivables/circuit-breaker-factory/_module.js";
import {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    UnregisteredAdapterError,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    DefaultAdapterNotDefinedError,
} from "@/utilities/_module-exports.js";

import type {
    ICircuitBreakerFactoryResolver,
    ICircuitBreakerFactory,
    ICircuitBreakerAdapter,
} from "@/circuit-breaker/contracts/_module-exports.js";
import type { CircuitBreakerFactorySettingsBase } from "@/circuit-breaker/implementations/derivables/circuit-breaker-factory/_module.js";
import type { IInitizable } from "@/utilities/_module-exports.js";

/**
 * IMPORT_PATH: `"eridu-tech/circuit-breaker"`
 * @group Derivables
 */
export type CircuitBreakerAdapters<TAdapters extends string> = Partial<
    Record<TAdapters, ICircuitBreakerAdapter>
>;

/**
 * Configuration for `CircuitBreakerFactoryResolver`.
 * Registers named circuit-breaker adapters and optionally designates a default.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker"`
 * @group Derivables
 */
export type CircuitBreakerFactoryResolverSettings<TAdapters extends string> =
    CircuitBreakerFactorySettingsBase & {
        /**
         * Named registry of circuit-breaker adapters. Each key is an adapter alias and the corresponding value is the adapter instance.
         */
        adapters: CircuitBreakerAdapters<TAdapters>;

        /**
         * The alias of the adapter to use when none is explicitly specified. Must be a key in the `adapters` map.
         */
        defaultAdapter?: NoInfer<TAdapters>;
    };

/**
 * The `CircuitBreakerFactoryResolver` class is immutable.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker"`
 * @group Derivables
 */
export class CircuitBreakerFactoryResolver<TAdapters extends string>
    implements ICircuitBreakerFactoryResolver<TAdapters>, IInitizable
{
    constructor(
        private readonly settings: CircuitBreakerFactoryResolverSettings<TAdapters>,
    ) {}

    private readonly factories = {} as Partial<
        Record<TAdapters, CircuitBreakerFactory>
    >;

    async init(): Promise<void> {
        const { adapters, ...rest } = this.settings;
        for (const adapterName in adapters) {
            const adapter = this.settings.adapters[adapterName];
            if (adapter === undefined) {
                continue;
            }
            const factory = new CircuitBreakerFactory({
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
    ): ICircuitBreakerFactory {
        if (adapterName === undefined) {
            throw new DefaultAdapterNotDefinedError(
                CircuitBreakerFactoryResolver.name,
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
