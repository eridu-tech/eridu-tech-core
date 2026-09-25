/**
 * @module Cache
 */

import { withInvalidationFactory } from "@/cache/implementations/middlewares/with-invalidation-factory/_module.js";

import type { ICache } from "@/cache/contracts/_module.js";
import type { WithInvalidationSettings } from "@/cache/implementations/middlewares/with-invalidation-factory/_module.js";
import type { DiToken, IContainer } from "@/di/contracts/_module.js";
import type { MiddlewareFn } from "@/middleware/contracts/_module.js";

/**
 * IMPORT_PATH: `"eridu-tech/cache/middlewares/di"`
 * @group Middlewares
 */
export function registerWithInvalidation(
    container: IContainer,
    cacheToken: DiToken<Pick<ICache, "remove">>,
) {
    return <TParameters extends Array<unknown>, TReturn>(
        settings: WithInvalidationSettings<TParameters, TReturn>,
    ): MiddlewareFn<TParameters, Promise<TReturn>> => {
        return async (args) => {
            const cache = await container.resolveOrFail(cacheToken);
            const withInvalidation = withInvalidationFactory(cache);
            const middleware = withInvalidation<TParameters, TReturn>(settings);
            return middleware(args);
        };
    };
}
