/**
 * @module CircuitBreaker
 */

import { callInvocable } from "@/utilities/_module-exports.js";

import type {
    CircuitBreakerTrigger,
    ICircuitBreakerFactory,
} from "@/circuit-breaker/contracts/_module-exports.js";
import type { MiddlewareFn } from "@/middleware/contracts/_module-exports.js";
import type { ITimeSpan } from "@/time-span/contracts/_module-exports.js";
import type {
    Invocable,
    ErrorPolicySettings,
} from "@/utilities/_module-exports.js";

/**
 * Minimal resolver contract required by {@link withCircuitBreakerFactory}.
 *
 * A narrowed form of `ICircuitBreakerFactoryResolver`: `use()` only has to
 * return a factory that exposes `create`.
 *
 * @typeParam TAdapters - Union type of the registered adapter names.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/middlewares"`
 * @group Middlewares
 */
export type CreateCircuitBreakerResolver<TAdapters extends string = string> = {
    /**
     * Selects the circuit-breaker factory used to create circuits.
     *
     * @param adapterName - The adapter to use. Defaults to the resolver's
     * default adapter.
     * @returns The resolved factory, limited to `create`.
     */
    use(adapterName?: TAdapters): ICircuitBreakerFactory;
};

/**
 * Settings for the circuit-breaker middleware.
 *
 * @typeParam TParameters - Tuple type of the wrapped function's parameters.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/middlewares"`
 * @group Middlewares
 */
export type WithCircuitBreakerSettings<
    TParameters extends Array<unknown> = Array<unknown>,
> = ErrorPolicySettings & {
    /**
     *  A function that produces a unique identifier for the
     * circuit from the wrapped function's arguments. Each unique key gets its
     * own circuit state.
     */
    key: Invocable<[args: TParameters], string>;

    /**
     * Optional custom trigger that determines when the circuit should open.
     * If omitted the default trigger shipped with the circuit-breaker is used.
     */
    trigger?: CircuitBreakerTrigger;

    /**
     * Duration above which a call is considered "slow". When the slow-call
     * threshold is exceeded the call counts toward opening the circuit
     * (if configured in the trigger).
     */
    slowCallTime?: ITimeSpan;
};

/**
 * A middleware factory that wraps the wrapped function in a circuit breaker.
 *
 * Produced by {@link withCircuitBreakerFactory}; the circuit key comes from
 * the `key` setting.
 *
 * @typeParam TParameters - Tuple type of the wrapped function's parameters.
 * @typeParam TReturn - Return type of the wrapped function.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/middlewares"`
 * @group Middlewares
 */
export type WithCircuitBreaker = <TParameters extends Array<unknown>, TReturn>(
    settings: WithCircuitBreakerSettings<TParameters>,
) => MiddlewareFn<TParameters, Promise<TReturn>>;

/**
 * Resolver-facing API returned by {@link withCircuitBreakerFactory}.
 *
 * Calling `use()` returns a {@link WithCircuitBreaker} bound to the selected
 * adapter.
 *
 * @typeParam TAdapters - Union type of the registered adapter names.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/middlewares"`
 * @group Middlewares
 */
export type WithCircuitBreakerResolver<TAdapters extends string = string> = {
    /**
     * Selects the adapter the returned middleware factory uses.
     *
     * @param adapter - The adapter to use. Defaults to the resolver's default
     * adapter.
     * @returns A {@link WithCircuitBreaker} bound to the selected adapter.
     */
    use(adapter?: TAdapters): WithCircuitBreaker;
};

/**
 * Creates a middleware factory that wraps function calls with a
 * circuit-breaker.
 *
 * Each unique key (derived from the wrapped function's arguments) gets its
 * own circuit instance. When the circuit is open the wrapped function is not
 * called and an error is thrown instead, preventing cascading failures.
 * Calling the returned function uses the resolver's default adapter, while
 * `use()` selects a specific one.
 *
 * @typeParam TAdapters - Union type of the registered adapter names.
 * @param circuitBreakerFactoryResolver - The resolver used to select the
 * circuit-breaker factory.
 * @returns A {@link WithCircuitBreaker} that is also a
 *          {@link WithCircuitBreakerResolver}.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/middlewares"`
 * @group Middlewares
 */
export function withCircuitBreakerFactory<TAdapters extends string = string>(
    circuitBreakerFactoryResolver: CreateCircuitBreakerResolver<TAdapters>,
): WithCircuitBreaker & WithCircuitBreakerResolver<TAdapters> {
    const withCircuitBreakerResolver: WithCircuitBreakerResolver<TAdapters>["use"] =
        function use(adapter?: TAdapters): WithCircuitBreaker {
            return (settings) => {
                const { key, ...rest } = settings;
                return ({ next, args }) => {
                    return circuitBreakerFactoryResolver
                        .use(adapter)
                        .create(callInvocable(key, args), rest)
                        .runOrFail(next);
                };
            };
        };

    const middleware = withCircuitBreakerResolver() as WithCircuitBreaker &
        WithCircuitBreakerResolver<TAdapters>;
    middleware.use = withCircuitBreakerResolver;
    return middleware;
}
