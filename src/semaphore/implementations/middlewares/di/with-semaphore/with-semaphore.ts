/**
 * @module Semaphore
 */

import { withSemaphoreFactory } from "@/semaphore/implementations/middlewares/with-semaphore-factory/_module.js";

import type { DiToken, IContainer } from "@/di/contracts/_module.js";
import type { MiddlewareFn } from "@/middleware/contracts/_module.js";
import type { ISemaphoreFactory } from "@/semaphore/contracts/_module.js";
import type { WithSemaphoreSettings } from "@/semaphore/implementations/middlewares/with-semaphore-factory/_module.js";

/**
 * Creates a distributed-semaphore middleware that resolves its
 * {@link ISemaphoreFactory} from a dependency-injection container.
 *
 * The token is resolved on every invocation of the wrapped function, so a token
 * that is overridden or scoped after the middleware was built still takes
 * effect. Everything else matches {@link withSemaphoreFactory}.
 *
 * @param container - The container the semaphore factory is resolved from.
 * @param semaphoreFactoryToken - The token the semaphore factory is registered
 *        under.
 * @returns A function that accepts {@link WithSemaphoreSettings} and returns a
 *          middleware.
 * @throws {@link CanNotResolveServiceDiError} When the token is not registered.
 *
 * IMPORT_PATH: `"eridu-tech/semaphore/middlewares/di"`
 * @group Middlewares
 */
export function registerWithSemaphore(
    container: IContainer,
    semaphoreFactoryToken: DiToken<ISemaphoreFactory>,
) {
    return <TParameters extends Array<unknown>, TReturn>(
        settings: WithSemaphoreSettings<TParameters>,
    ): MiddlewareFn<TParameters, Promise<TReturn>> => {
        return async (args) => {
            const semaphoreFactory = await container.resolveOrFail(
                semaphoreFactoryToken,
            );
            const withSemaphore = withSemaphoreFactory(semaphoreFactory);
            const middleware = withSemaphore<TParameters, TReturn>(settings);
            return middleware(args);
        };
    };
}
