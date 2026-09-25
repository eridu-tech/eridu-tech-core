/**
 * @module Semaphore
 */

import { withSemaphoreFactory } from "@/semaphore/implementations/middlewares/with-semaphore-factory/_module.js";

import type { DiToken, IContainer } from "@/di/contracts/_module.js";
import type { MiddlewareFn } from "@/middleware/contracts/_module.js";
import type { ISemaphoreFactory } from "@/semaphore/contracts/_module.js";
import type { WithSemaphoreSettings } from "@/semaphore/implementations/middlewares/with-semaphore-factory/_module.js";

/**
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
