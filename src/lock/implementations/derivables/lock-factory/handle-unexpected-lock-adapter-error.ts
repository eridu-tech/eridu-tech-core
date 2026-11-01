/**
 * @module Lock
 */

import {
    UnableToAcquireLockError,
    UnableToForceReleaseLockError,
    UnableToGetStateLockError,
    UnableToRefreshLockError,
    UnableToReleaseLockError,
} from "@/lock/contracts/_module-exports.js";

import type { ILockAdapter } from "@/lock/contracts/_module-exports.js";
import type { PluginFn } from "@/middleware/contracts/_module-exports.js";

/**
 * Creates a plugin that converts unexpected errors thrown by a lock adapter into `UnableTo*LockError` errors.
 *
 * Every method of the wrapped `ILockAdapter` is wrapped in a `try`/`catch` block,
 * and the original error is preserved as the `cause` of the matching error:
 * - `acquire` throws {@link UnableToAcquireLockError | `UnableToAcquireLockError`}
 * - `release` throws {@link UnableToReleaseLockError | `UnableToReleaseLockError`}
 * - `forceRelease` throws {@link UnableToForceReleaseLockError | `UnableToForceReleaseLockError`}
 * - `refresh` throws {@link UnableToRefreshLockError | `UnableToRefreshLockError`}
 * - `getState` throws {@link UnableToGetStateLockError | `UnableToGetStateLockError`}
 *
 * @internal
 */
export function handleUnexpectedLockAdapterError(): PluginFn<ILockAdapter> {
    return (adapter, enhance) => {
        enhance(adapter, "acquire", async ({ args: [key], next }) => {
            try {
                return await next();
            } catch (cause) {
                throw UnableToAcquireLockError.create(key, cause);
            }
        });
        enhance(adapter, "release", async ({ args: [key, lockId], next }) => {
            try {
                return await next();
            } catch (cause) {
                throw UnableToReleaseLockError.create(key, lockId, cause);
            }
        });
        enhance(adapter, "forceRelease", async ({ args: [key], next }) => {
            try {
                return await next();
            } catch (cause) {
                throw UnableToForceReleaseLockError.create(key, cause);
            }
        });
        enhance(adapter, "refresh", async ({ args: [key, lockId], next }) => {
            try {
                return await next();
            } catch (cause) {
                throw UnableToRefreshLockError.create(key, lockId, cause);
            }
        });
        enhance(adapter, "getState", async ({ args: [key], next }) => {
            try {
                return await next();
            } catch (cause) {
                throw UnableToGetStateLockError.create(key, cause);
            }
        });
    };
}
