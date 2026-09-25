/**
 * @module Cache
 */

import { withCacheFactory } from "@/cache/implementations/middlewares/with-cache-factory/_module.js";

import type { ICache } from "@/cache/contracts/_module.js";
import type { WithCacheSettings } from "@/cache/implementations/middlewares/with-cache-factory/_module.js";
import type { DiToken, IContainer } from "@/di/contracts/_module.js";
import type { MiddlewareFn } from "@/middleware/contracts/_module.js";

/**
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
