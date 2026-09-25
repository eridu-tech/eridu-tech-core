/**
 * @module SharedLock
 */

import { withSharedLockFactory } from "@/shared-lock/implementations/middlewares/with-shared-lock-factory/_module.js";

import type { DiToken, IContainer } from "@/di/contracts/_module.js";
import type { MiddlewareFn } from "@/middleware/contracts/_module.js";
import type { ISharedLockFactory } from "@/shared-lock/contracts/_module.js";
import type { WithSharedLockFactorySettings } from "@/shared-lock/implementations/middlewares/with-shared-lock-factory/_module.js";

/**
 * Creates a distributed shared-lock middleware that resolves its
 * {@link ISharedLockFactory} from a dependency-injection container.
 *
 * The token is resolved on every invocation of the wrapped function, so a token
 * that is overridden or scoped after the middleware was built still takes
 * effect. Everything else matches {@link withSharedLockFactory}.
 *
 * @param container - The container the shared-lock factory is resolved from.
 * @param sharedLockFactoryToken - The token the shared-lock factory is registered
 *        under.
 * @returns A function that accepts {@link WithSharedLockFactorySettings} and
 *          returns a middleware.
 * @throws {@link CanNotResolveServiceDiError} When the token is not registered.
 *
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
