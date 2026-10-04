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
    CircuitBreakerTrigger,
    ICircuitBreakerFactory,
    ICircuitBreakerAdapter,
} from "@/circuit-breaker/contracts/_module-exports.js";
import type { CircuitBreakerFactorySettingsBase } from "@/circuit-breaker/implementations/derivables/circuit-breaker-factory/_module.js";
import type { ITimeSpan } from "@/time-span/contracts/_module-exports.js";
import type { ErrorPolicy, WaitUntil } from "@/utilities/_module-exports.js";

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
export class CircuitBreakerFactoryResolver<
    TAdapters extends string,
> implements ICircuitBreakerFactoryResolver<TAdapters> {
    constructor(
        private readonly settings: CircuitBreakerFactoryResolverSettings<TAdapters>,
    ) {}

    setDefaultSlowCallTime(
        slowCallTime?: ITimeSpan,
    ): CircuitBreakerFactoryResolver<TAdapters> {
        return new CircuitBreakerFactoryResolver({
            ...this.settings,
            defaultSlowCallTime: slowCallTime,
        });
    }

    setDefaultTrigger(
        trigger?: CircuitBreakerTrigger,
    ): CircuitBreakerFactoryResolver<TAdapters> {
        return new CircuitBreakerFactoryResolver({
            ...this.settings,
            defaultTrigger: trigger,
        });
    }

    setDefaultErrorPolicy(
        defaultErrorPolicy: ErrorPolicy,
    ): CircuitBreakerFactoryResolver<TAdapters> {
        return new CircuitBreakerFactoryResolver({
            ...this.settings,
            defaultErrorPolicy,
        });
    }

    setWaitUntil(
        waitUntil: WaitUntil,
    ): CircuitBreakerFactoryResolver<TAdapters> {
        return new CircuitBreakerFactoryResolver({
            ...this.settings,
            waitUntil,
        });
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
        const adapter = this.settings.adapters[adapterName];
        if (adapter === undefined) {
            throw new UnregisteredAdapterError(
                adapterName,
                Object.keys(this.settings.adapters),
            );
        }
        return new CircuitBreakerFactory({
            ...this.settings,
            adapter,
            serdeTransformerName: adapterName,
        });
    }
}
