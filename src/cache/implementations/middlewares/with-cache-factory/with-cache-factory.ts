/**
 * @module Cache
 */

import { callInvocable } from "@/utilities/_module-exports.js";

import type { ICache } from "@/cache/contracts/_module-exports.js";
import type { MiddlewareFn } from "@/middleware/contracts/_module-exports.js";
import type { ITimeSpan } from "@/time-span/contracts/_module-exports.js";
import type { Invocable } from "@/utilities/_module-exports.js";

/**
 * Minimal resolver contract required by {@link withCacheFactory}.
 *
 * A narrowed form of `ICacheResolver`: `use()` only has to return a cache that
 * exposes `getOrAdd`.
 *
 * @typeParam TAdapters - Union type of the registered adapter names.
 *
 * IMPORT_PATH: `"eridu-tech/cache/middlewares"`
 * @group Middlewares
 */
export type GetOrAddCacheResolver<TAdapters extends string = string> = {
    /**
     * Selects the cache adapter used for `getOrAdd`.
     *
     * @param adapterName - The adapter to use. Defaults to the resolver's
     * default adapter.
     * @returns The resolved cache, limited to `getOrAdd`.
     */
    use(adapterName?: TAdapters): Pick<ICache, "getOrAdd">;
};

/**
 * Settings for the cache middleware.
 *
 * @typeParam TParameters - Tuple type of the wrapped function's parameters.
 *
 * IMPORT_PATH: `"eridu-tech/cache/middlewares"`
 * @group Middlewares
 */
export type WithCacheSettings<
    TParameters extends Array<unknown> = Array<unknown>,
> = {
    ttl?: ITimeSpan | null;

    /**
     *  A function that produces the cache key from the
     * wrapped function's arguments.
     */
    key: Invocable<[args: TParameters], string>;
};

/**
 * A middleware factory that caches the wrapped function's return value.
 *
 * Produced by {@link withCacheFactory}.
 *
 * @typeParam TParameters - Tuple type of the wrapped function's parameters.
 * @typeParam TReturn - Return type of the wrapped function.
 *
 * IMPORT_PATH: `"eridu-tech/cache/middlewares"`
 * @group Middlewares
 */
export type WithCache = <TParameters extends Array<unknown>, TReturn>(
    settings: WithCacheSettings<TParameters>,
) => MiddlewareFn<TParameters, Promise<TReturn>>;

/**
 * Resolver-facing API returned by {@link withCacheFactory}.
 *
 * Calling `use()` returns a {@link WithCache} bound to the selected adapter.
 *
 * @typeParam TAdapters - Union type of the registered adapter names.
 *
 * IMPORT_PATH: `"eridu-tech/cache/middlewares"`
 * @group Middlewares
 */
export type WitCacheResolver<TAdapters extends string = string> = {
    /**
     * Selects the adapter the returned middleware factory uses.
     *
     * @param adapter - The adapter to use. Defaults to the resolver's default
     * adapter.
     * @returns A {@link WithCache} bound to the selected adapter.
     */
    use(adapter?: TAdapters): WithCache;
};

/**
 * Creates a middleware factory that caches the wrapped function's return value
 * through the given cache resolver.
 *
 * The cache key comes from the `key` setting. On a miss the wrapped function is
 * invoked and its result is stored with the configured `ttl`. Calling the
 * returned function uses the resolver's default adapter, while `use()` selects
 * a specific one.
 *
 * @typeParam TAdapters - Union type of the registered adapter names.
 * @param cache - The resolver used to select the cache adapter.
 * @returns A {@link WithCache} that is also a {@link WitCacheResolver}.
 *
 * IMPORT_PATH: `"eridu-tech/cache/middlewares"`
 * @group Middlewares
 */
export function withCacheFactory<TAdapters extends string = string>(
    cache: GetOrAddCacheResolver<TAdapters>,
): WithCache & WitCacheResolver<TAdapters> {
    const witCacheResolver: WitCacheResolver<TAdapters>["use"] = function use(
        adapter?: TAdapters,
    ): WithCache {
        return (settings) => {
            const { key, ttl } = settings;
            return ({ next, args }) => {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                return cache
                    .use(adapter)
                    .getOrAdd(
                        callInvocable(key, args),
                        next,
                        ttl,
                    ) as Promise<any>;
            };
        };
    };

    const middleware = witCacheResolver() as WithCache &
        WitCacheResolver<TAdapters>;
    middleware.use = witCacheResolver;
    return middleware;
}
