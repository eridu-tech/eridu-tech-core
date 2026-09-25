/**
 * @module Lock
 */

import { withLockFactory } from "@/lock/implementations/middlewares/with-lock-factory/_module.js";

import type { DiToken, IContainer } from "@/di/contracts/_module.js";
import type { ILockFactory } from "@/lock/contracts/_module.js";
import type { WithLockSettings } from "@/lock/implementations/middlewares/with-lock-factory/_module.js";
import type { MiddlewareFn } from "@/middleware/contracts/_module.js";

/**
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
