/**
 * @module Lock
 */

import { withLockFactory } from "@/lock/implementations/middlewares/with-lock-factory/_module.js";

import type { DiToken, IContainer } from "@/di/contracts/_module.js";
import type { ILockFactory } from "@/lock/contracts/_module.js";
import type { WithLockSettings } from "@/lock/implementations/middlewares/with-lock-factory/_module.js";
import type { MiddlewareFn } from "@/middleware/contracts/_module.js";

/**
 * Creates a distributed-lock middleware that resolves its {@link ILockFactory}
 * from a dependency-injection container.
 *
 * The token is resolved on every invocation of the wrapped function, so a token
 * that is overridden or scoped after the middleware was built still takes
 * effect. Everything else matches {@link withLockFactory}.
 *
 * @param container - The container the lock factory is resolved from.
 * @param lockFactoryToken - The token the lock factory is registered under.
 * @returns A function that accepts {@link WithLockSettings} and returns a
 *          middleware.
 * @throws {@link CanNotResolveServiceDiError} When the token is not registered.
 *
 * IMPORT_PATH: `"eridu-tech/lock/middlewares/di"`
 * @group Middlewares
 */
export function registerWithLock(
    container: IContainer,
    lockFactoryToken: DiToken<ILockFactory>,
) {
    return <TParameters extends Array<unknown>, TReturn>(
        settings: WithLockSettings<TParameters>,
    ): MiddlewareFn<TParameters, Promise<TReturn>> => {
        return async (args) => {
            const lockFactory = await container.resolveOrFail(lockFactoryToken);
            const withLock = withLockFactory(lockFactory);
            const middleware = withLock<TParameters, TReturn>(settings);
            return middleware(args);
        };
    };
}
