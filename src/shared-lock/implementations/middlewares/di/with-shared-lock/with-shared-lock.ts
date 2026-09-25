/**
 * @module SharedLock
 */

import { withSharedLockFactory } from "@/shared-lock/implementations/middlewares/with-shared-lock-factory/_module.js";

import type { DiToken, IContainer } from "@/di/contracts/_module.js";
import type { MiddlewareFn } from "@/middleware/contracts/_module.js";
import type { ISharedLockFactory } from "@/shared-lock/contracts/_module.js";
import type { WithSharedLockFactorySettings } from "@/shared-lock/implementations/middlewares/with-shared-lock-factory/_module.js";

/**
 * IMPORT_PATH: `"eridu-tech/shared-lock/middlewares/di"`
 * @group Middlewares
 */
export function registerWithSharedLock(
    container: IContainer,
    sharedLockFactoryToken: DiToken<ISharedLockFactory>,
) {
    return <TParameters extends Array<unknown>, TReturn>(
        settings: WithSharedLockFactorySettings<TParameters>,
    ): MiddlewareFn<TParameters, Promise<TReturn>> => {
        return async (args) => {
            const sharedLockFactory = await container.resolveOrFail(
                sharedLockFactoryToken,
            );
            const withSharedLock = withSharedLockFactory(sharedLockFactory);
            const middleware = withSharedLock<TParameters, TReturn>(settings);
            return middleware(args);
        };
    };
}
