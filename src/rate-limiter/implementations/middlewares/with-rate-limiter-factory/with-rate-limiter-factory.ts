/**
 * @module RateLimiter
 */

import { callInvocable } from "@/utilities/_module-exports.js";

import type { MiddlewareFn } from "@/middleware/contracts/_module-exports.js";
import type { IRateLimiterFactory } from "@/rate-limiter/contracts/_module-exports.js";
import type {
    ErrorPolicySettings,
    Invocable,
} from "@/utilities/_module-exports.js";

/**
 * Minimal resolver contract required by {@link withRateLimiterFactory}.
 *
 * A narrowed form of `IRateLimiterFactoryResolver`: `use()` only has to return
 * a factory that exposes `create`.
 *
 * @typeParam TAdapters - Union type of the registered adapter names.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/middlewares"`
 * @group Middlewares
 */
export type CreateRateLimiterResolver<TAdapters extends string = string> = {
    /**
     * Selects the rate-limiter factory used to create rate limiters.
     *
     * @param adapterName - The adapter to use. Defaults to the resolver's
     * default adapter.
     * @returns The resolved factory, limited to `create`.
     */
    use(adapterName?: TAdapters): IRateLimiterFactory;
};

/**
 * Settings for the rate-limiter middleware.
 *
 * @typeParam TParameters - Tuple type of the wrapped function's parameters.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/middlewares"`
 * @group Middlewares
 */
export type WithRateLimiterSettings<
    TParameters extends Array<unknown> = Array<unknown>,
> = ErrorPolicySettings & {
    /**
     *  A function that produces the rate-limiter key from the
     * wrapped function's arguments. Each unique key gets its own rate-limit
     * counter.
     */
    key: Invocable<[args: TParameters], string>;

    /**
     * When `true`, only failed (errored) invocations count toward the rate
     * limit. Successful calls are ignored.
     *
     * @default false
     */
    onlyError?: boolean;

    /**
     * Maximum number of invocations allowed within the configured window.
     */
    limit: number;
};

/**
 * A middleware factory that wraps the wrapped function in a rate limiter.
 *
 * Produced by {@link withRateLimiterFactory}; the rate-limit key comes from
 * the `key` setting.
 *
 * @typeParam TParameters - Tuple type of the wrapped function's parameters.
 * @typeParam TReturn - Return type of the wrapped function.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/middlewares"`
 * @group Middlewares
 */
export type WithRateLimiter = <TParameters extends Array<unknown>, TReturn>(
    settings: WithRateLimiterSettings<TParameters>,
) => MiddlewareFn<TParameters, Promise<TReturn>>;

/**
 * Resolver-facing API returned by {@link withRateLimiterFactory}.
 *
 * Calling `use()` returns a {@link WithRateLimiter} bound to the selected
 * adapter.
 *
 * @typeParam TAdapters - Union type of the registered adapter names.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/middlewares"`
 * @group Middlewares
 */
export type WithRateLimiterResolver<TAdapters extends string = string> = {
    /**
     * Selects the adapter the returned middleware factory uses.
     *
     * @param adapter - The adapter to use. Defaults to the resolver's default
     * adapter.
     * @returns A {@link WithRateLimiter} bound to the selected adapter.
     */
    use(adapter?: TAdapters): WithRateLimiter;
};

/**
 * A higher-order function that creates a middleware factory which wraps
 * function calls with a rate limiter.
 *
 * Each unique key (derived from the wrapped function's arguments) gets its
 * own rate-limit counter. When the maximum number of invocations (`limit`)
 * is exceeded within the configured window subsequent calls throw a
 * rate-limit error instead of executing the wrapped function. Calling the
 * returned function uses the resolver's default adapter, while `use()` selects
 * a specific one.
 *
 * @typeParam TAdapters - Union type of the registered adapter names.
 * @param rateLimiterFactoryResolver - The resolver used to select the
 * rate-limiter factory.
 * @returns A {@link WithRateLimiter} that is also a
 *          {@link WithRateLimiterResolver}.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/middlewares"`
 * @group Middlewares
 */
export function withRateLimiterFactory<TAdapters extends string = string>(
    rateLimiterFactoryResolver: CreateRateLimiterResolver<TAdapters>,
): WithRateLimiter & WithRateLimiterResolver<TAdapters> {
    const withRateLimiterResolver: WithRateLimiterResolver<TAdapters>["use"] =
        function use(adapter?: TAdapters): WithRateLimiter {
            return (settings) => {
                const { key, ...rest } = settings;
                return ({ next, args }) => {
                    return rateLimiterFactoryResolver
                        .use(adapter)
                        .create(callInvocable(key, args), rest)
                        .runOrFail(next);
                };
            };
        };

    const middleware = withRateLimiterResolver() as WithRateLimiter &
        WithRateLimiterResolver<TAdapters>;
    middleware.use = withRateLimiterResolver;
    return middleware;
}
