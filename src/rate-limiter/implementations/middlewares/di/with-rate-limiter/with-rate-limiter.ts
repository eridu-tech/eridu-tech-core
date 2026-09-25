/**
 * @module RateLimiter
 */

import { withRateLimiterFactory } from "@/rate-limiter/implementations/middlewares/with-rate-limiter-factory/_module.js";

import type { DiToken, IContainer } from "@/di/contracts/_module.js";
import type { MiddlewareFn } from "@/middleware/contracts/_module.js";
import type { IRateLimiterFactory } from "@/rate-limiter/contracts/_module.js";
import type { WithRateLimiterSettings } from "@/rate-limiter/implementations/middlewares/with-rate-limiter-factory/_module.js";

/**
 * Creates a rate-limiter middleware that resolves its {@link IRateLimiterFactory}
 * from a dependency-injection container.
 *
 * The token is resolved on every invocation of the wrapped function, so a token
 * that is overridden or scoped after the middleware was built still takes
 * effect. Everything else matches {@link withRateLimiterFactory}.
 *
 * @param container - The container the rate-limiter factory is resolved from.
 * @param rateLimiterFactoryToken - The token the rate-limiter factory is
 *        registered under.
 * @returns A function that accepts {@link WithRateLimiterSettings} and returns a
 *          middleware.
 * @throws {@link CanNotResolveServiceDiError} When the token is not registered.
 *
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
