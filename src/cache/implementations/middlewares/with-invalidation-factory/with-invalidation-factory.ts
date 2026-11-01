/**
 * @module Cache
 */

import { callInvocable } from "@/utilities/_module-exports.js";

import type { ICache } from "@/cache/contracts/_module-exports.js";
import type { MiddlewareFn } from "@/middleware/contracts/_module-exports.js";
import type { Invocable } from "@/utilities/_module-exports.js";

/**
 * Minimal cache resolver contract required by {@link withInvalidationFactory}.
 *
 * IMPORT_PATH: `"eridu-tech/cache/middlewares"`
 * @group Middlewares
 */
export type RemoveCacheResolver<TAdapters extends string = string> = {
    /**
     * Selects the cache adapter used to remove the entry.
     *
     * @param adapter - The adapter to use. Defaults to the resolver's default
     * adapter.
     */
    use(adapter?: TAdapters): Pick<ICache, "remove">;
};

/**
 * @typeParam TParameters - Tuple type of the wrapped function's parameters.
 *
 * IMPORT_PATH: `"eridu-tech/cache/middlewares"`
 * @group Middlewares
 */
export type WithInvalidationSettings<
    TParameters extends Array<unknown> = Array<unknown>,
    TReturn = unknown,
> = {
    /**
     *  A function that produces the cache key from the
     * wrapped function's arguments.
     */
    key: Invocable<[args: TParameters], string>;

    /**
     * A function that determines whether the cache entry should be
     * invalidated after the wrapped function has been invoked.
     *
     * It receives the wrapped function's arguments and its return value.
     * When it returns `true`, the cache entry identified by `key` is removed.
     *
     * @default
     * ```ts
     * () => true
     * ```
     */
    shouldInvalidate?: Invocable<
        [args: TParameters, returnValue: TReturn],
        boolean
    >;
};

/**
 * A middleware factory that invalidates a cache entry after the wrapped
 * function has been invoked.
 *
 * IMPORT_PATH: `"eridu-tech/cache/middlewares"`
 * @group Middlewares
 */
export type WithInvalidation = <TParameters extends Array<unknown>, TReturn>(
    settings: WithInvalidationSettings<TParameters, TReturn>,
) => MiddlewareFn<TParameters, Promise<TReturn>>;

/**
 * Resolver-facing API returned by {@link withInvalidationFactory}.
 *
 * IMPORT_PATH: `"eridu-tech/cache/middlewares"`
 * @group Middlewares
 */
export type WithInvalidationResolver<TAdapters extends string = string> = {
    /**
     * Selects the adapter the returned middleware factory uses.
     *
     * @param adapter - The adapter to use. Defaults to the resolver's default
     * adapter.
     */
    use(adapter?: TAdapters): WithInvalidation;
};

/**
 * Creates a middleware factory that invalidates a cache entry after the
 * wrapped function has been invoked.
 *
 * This is useful for write-invalidation caching patterns, where stale cached
 * data must be cleared after a mutation.
 *
 * @typeParam TAdapters - Union type of the registered adapter names.
 * @param cacheResolver - The resolver used to select the cache adapter.
 * @returns A {@link WithInvalidation} that is also a
 *          {@link WithInvalidationResolver}.
 *
 * IMPORT_PATH: `"eridu-tech/cache/middlewares"`
 * @group Middlewares
 */
export function withInvalidationFactory<TAdapters extends string = string>(
    cacheResolver: RemoveCacheResolver<TAdapters>,
): WithInvalidation & WithInvalidationResolver<TAdapters> {
    const withInvalidationResolver: WithInvalidationResolver<TAdapters>["use"] =
        function use(adapter?: TAdapters): WithInvalidation {
            return (settings) => {
                const { key, shouldInvalidate = () => true } = settings;
                return async ({ next, args }) => {
                    const value = await next();
                    if (callInvocable(shouldInvalidate, args, value)) {
                        await cacheResolver
                            .use(adapter)
                            .remove(callInvocable(key, args));
                    }
                    return value;
                };
            };
        };

    const middleware = withInvalidationResolver() as WithInvalidation &
        WithInvalidationResolver<TAdapters>;
    middleware.use = withInvalidationResolver;
    return middleware;
}
