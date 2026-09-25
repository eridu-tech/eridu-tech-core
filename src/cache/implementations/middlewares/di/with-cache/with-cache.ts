/**
 * @module Cache
 */

import { withCacheFactory } from "@/cache/implementations/middlewares/with-cache-factory/_module.js";

import type { ICache } from "@/cache/contracts/_module.js";
import type { WithCacheSettings } from "@/cache/implementations/middlewares/with-cache-factory/_module.js";
import type { DiToken, IContainer } from "@/di/contracts/_module.js";
import type { MiddlewareFn } from "@/middleware/contracts/_module.js";

/**
 * Creates a cache middleware that resolves its {@link ICache} from a
 * dependency-injection container.
 *
 * The token is resolved on every invocation of the wrapped function, so a token
 * that is overridden or scoped after the middleware was built still takes
 * effect. Everything else matches {@link withCacheFactory}.
 *
 * @param container - The container the cache is resolved from.
 * @param cacheToken - The token the cache is registered under.
 * @returns A function that accepts {@link WithCacheSettings} and returns a
 *          middleware.
 * @throws {@link CanNotResolveServiceDiError} When the token is not registered.
 *
 * IMPORT_PATH: `"eridu-tech/cache/middlewares/di"`
 * @group Middlewares
 */
export function registerWithCache(
    container: IContainer,
    cacheToken: DiToken<Pick<ICache, "getOrAdd">>,
) {
    return <TParameters extends Array<unknown>, TReturn>(
        settings: WithCacheSettings<TParameters>,
    ): MiddlewareFn<TParameters, Promise<TReturn>> => {
        return async (args) => {
            const cache = await container.resolveOrFail(cacheToken);
            const withCache = withCacheFactory(cache);
            const middleware = withCache<TParameters, TReturn>(settings);
            return middleware(args);
        };
    };
}
