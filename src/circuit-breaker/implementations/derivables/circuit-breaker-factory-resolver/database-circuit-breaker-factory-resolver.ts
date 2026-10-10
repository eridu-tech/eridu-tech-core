/**
 * @module CircuitBreaker
 */

import { DatabaseCircuitBreakerAdapter } from "@/circuit-breaker/implementations/adapters/database-circuit-breaker-adapter/_module-exports.js";
import { CircuitBreakerFactory } from "@/circuit-breaker/implementations/derivables/circuit-breaker-factory/_module.js";
import {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    UnregisteredAdapterError,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    DefaultAdapterNotDefinedError,
} from "@/utilities/_module-exports.js";

import type { BackoffPolicy } from "@/backoff-policies/contracts/_module.js";
import type {
    ICircuitBreakerFactoryResolver,
    CircuitBreakerTrigger,
    ICircuitBreakerFactory,
    ICircuitBreakerStorageAdapter,
    ICircuitBreakerPolicy,
} from "@/circuit-breaker/contracts/_module-exports.js";
import type { CircuitBreakerFactorySettingsBase } from "@/circuit-breaker/implementations/derivables/circuit-breaker-factory/_module.js";
import type { ITimeSpan } from "@/time-span/contracts/_module-exports.js";
import type { ErrorPolicy, WaitUntil } from "@/utilities/_module-exports.js";

/**
 * IMPORT_PATH: `"eridu-tech/circuit-breaker"`
 * @group Derivables
 */
export type DatabaseCircuitBreakerAdapters<TAdapters extends string> = Partial<
    Record<TAdapters, ICircuitBreakerStorageAdapter>
>;

/**
 * Configuration for `DatabaseCircuitBreakerFactoryResolver`.
 * Convenience resolver that wires a {@link ICircuitBreakerStorageAdapter | `ICircuitBreakerStorageAdapter`} database adapter
 * with circuit-breaker logic and registers it as the sole named adapter.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker"`
 * @group Derivables
 */
export type DatabaseCircuitBreakerFactoryResolverSettings<
    TAdapters extends string,
> = CircuitBreakerFactorySettingsBase & {
    /**
     * Named registry of circuit-breaker storage adapters. Each key is an adapter alias and the corresponding value is the adapter instance.
     */
    adapters: DatabaseCircuitBreakerAdapters<TAdapters>;

    /**
     * The alias of the adapter to use when none is explicitly specified. Must be a key in the `adapters` map.
     */
    defaultAdapter?: NoInfer<TAdapters>;

    /**
     * @default
     * ```ts
     * import { exponentialBackoff } from "eridu-tech/backoff-policies";
     *
     * exponentialBackoff();
     * ```
     */
    backoffPolicy?: BackoffPolicy;

    /**
     * @default
     * ```ts
     * import { ConsecutiveBreaker } from "eridu-tech/circuit-breaker/policies";
     *
     * new ConsecutiveBreaker();
     * ```
     */
    circuitBreakerPolicy?: ICircuitBreakerPolicy;
};

/**
 * The `DatabaseCircuitBreakerFactoryResolver` class is immutable.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker"`
 * @group Derivables
 */
export class DatabaseCircuitBreakerFactoryResolver<
    TAdapters extends string,
> implements ICircuitBreakerFactoryResolver<TAdapters> {
    constructor(
        private readonly settings: DatabaseCircuitBreakerFactoryResolverSettings<TAdapters>,
    ) {}

    setSlowCallTime(
        slowCallTime?: ITimeSpan,
    ): DatabaseCircuitBreakerFactoryResolver<TAdapters> {
        return new DatabaseCircuitBreakerFactoryResolver({
            ...this.settings,
            defaultSlowCallTime: slowCallTime,
        });
    }

    setTrigger(
        trigger?: CircuitBreakerTrigger,
    ): DatabaseCircuitBreakerFactoryResolver<TAdapters> {
        return new DatabaseCircuitBreakerFactoryResolver({
            ...this.settings,
            defaultTrigger: trigger,
        });
    }

    setDefaultErrorPolicy(
        defaultErrorPolicy: ErrorPolicy,
    ): DatabaseCircuitBreakerFactoryResolver<TAdapters> {
        return new DatabaseCircuitBreakerFactoryResolver({
            ...this.settings,
            defaultErrorPolicy,
        });
    }

    setDefaultBackoffPolicy(
        backoffPolicy?: BackoffPolicy,
    ): DatabaseCircuitBreakerFactoryResolver<TAdapters> {
        return new DatabaseCircuitBreakerFactoryResolver({
            ...this.settings,
            backoffPolicy,
        });
    }

    setDefaultCircuitBreakerPolicy(
        circuitBreakerPolicy?: ICircuitBreakerPolicy,
    ): DatabaseCircuitBreakerFactoryResolver<TAdapters> {
        return new DatabaseCircuitBreakerFactoryResolver({
            ...this.settings,
            circuitBreakerPolicy,
        });
    }

    setWaitUntil(
        waitUntil: WaitUntil,
    ): DatabaseCircuitBreakerFactoryResolver<TAdapters> {
        return new DatabaseCircuitBreakerFactoryResolver({
            ...this.settings,
            waitUntil,
        });
    }

    use(
        adapterName: TAdapters | undefined = this.settings.defaultAdapter,
    ): ICircuitBreakerFactory {
        if (adapterName === undefined) {
            throw new DefaultAdapterNotDefinedError(
                DatabaseCircuitBreakerFactoryResolver.name,
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
            adapter: new DatabaseCircuitBreakerAdapter({
                adapter,
            }),
            serializationId: adapterName,
        });
    }
}
