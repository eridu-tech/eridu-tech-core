/**
 * @module RateLimiter
 */

import { withRateLimiterFactory } from "@/rate-limiter/implementations/middlewares/with-rate-limiter-factory/_module.js";

import type { DiToken, IContainer } from "@/di/contracts/_module.js";
import type { MiddlewareFn } from "@/middleware/contracts/_module.js";
import type { IRateLimiterFactory } from "@/rate-limiter/contracts/_module.js";
import type { WithRateLimiterSettings } from "@/rate-limiter/implementations/middlewares/with-rate-limiter-factory/_module.js";

/**
 * IMPORT_PATH: `"eridu-tech/rate-limiter/middlewares/di"`
 * @group Middlewares
 */
export function registerWithRateLimiter(
    container: IContainer,
    rateLimiterFactoryToken: DiToken<IRateLimiterFactory>,
) {
    return <TParameters extends Array<unknown>, TReturn>(
        settings: WithRateLimiterSettings<TParameters>,
    ): MiddlewareFn<TParameters, Promise<TReturn>> => {
        return async (args) => {
            const rateLimiterFactory = await container.resolveOrFail(
                rateLimiterFactoryToken,
            );
            const withRateLimiter = withRateLimiterFactory(rateLimiterFactory);
            const middleware = withRateLimiter<TParameters, TReturn>(settings);
            return middleware(args);
        };
    };
}
