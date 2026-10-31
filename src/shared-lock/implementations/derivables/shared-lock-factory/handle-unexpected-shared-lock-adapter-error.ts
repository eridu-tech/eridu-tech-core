/**
 * @module SharedLock
 */

import {
    UnableToAcquireReaderSemaphoreError,
    UnableToAcquireWriterLockError,
    UnableToForceReleaseSharedLockError,
    UnableToGetStateSharedLockError,
    UnableToRefreshReaderSemaphoreError,
    UnableToRefreshWriterLockError,
    UnableToReleaseReaderSemaphoreError,
    UnableToReleaseWriterLockError,
} from "@/shared-lock/contracts/_module-exports.js";

import type { PluginFn } from "@/middleware/contracts/_module-exports.js";
import type { ISharedLockAdapter } from "@/shared-lock/contracts/_module-exports.js";

/**
 * Creates a plugin that converts unexpected errors thrown by a shared-lock adapter into `UnableTo*` errors.
 *
 * Every method of the wrapped `ISharedLockAdapter` is wrapped in a `try`/`catch` block,
 * and the original error is preserved as the `cause` of the matching error:
 * - `acquireWriter` throws {@link UnableToAcquireWriterLockError | `UnableToAcquireWriterLockError`}
 * - `releaseWriter` throws {@link UnableToReleaseWriterLockError | `UnableToReleaseWriterLockError`}
 * - `refreshWriter` throws {@link UnableToRefreshWriterLockError | `UnableToRefreshWriterLockError`}
 * - `acquireReader` throws {@link UnableToAcquireReaderSemaphoreError | `UnableToAcquireReaderSemaphoreError`}
 * - `releaseReader` throws {@link UnableToReleaseReaderSemaphoreError | `UnableToReleaseReaderSemaphoreError`}
 * - `refreshReader` throws {@link UnableToRefreshReaderSemaphoreError | `UnableToRefreshReaderSemaphoreError`}
 * - `forceRelease` throws {@link UnableToForceReleaseSharedLockError | `UnableToForceReleaseSharedLockError`}
 * - `getState` throws {@link UnableToGetStateSharedLockError | `UnableToGetStateSharedLockError`}
 *
 * @returns A middleware plugin that wraps an `ISharedLockAdapter`.
 *
 * IMPORT_PATH: `"eridu-tech/shared-lock"`
 * @group Derivables
 * @internal
 */
export function handleUnexpectedSharedLockAdapterError(): PluginFn<ISharedLockAdapter> {
    return (adapter, enhance) => {
        enhance(
            adapter,
            "acquireWriter",
            async ({ args: [key, lockId], next }) => {
                try {
                    return await next();
                } catch (cause) {
                    throw UnableToAcquireWriterLockError.create(
                        key,
                        lockId,
                        cause,
                    );
                }
            },
        );
        enhance(
            adapter,
            "releaseWriter",
            async ({ args: [key, lockId], next }) => {
                try {
                    return await next();
                } catch (cause) {
                    throw UnableToReleaseWriterLockError.create(
                        key,
                        lockId,
                        cause,
                    );
                }
            },
        );
        enhance(
            adapter,
            "refreshWriter",
            async ({ args: [key, lockId], next }) => {
                try {
                    return await next();
                } catch (cause) {
                    throw UnableToRefreshWriterLockError.create(
                        key,
                        lockId,
                        cause,
                    );
                }
            },
        );
        enhance(
            adapter,
            "acquireReader",
            async ({ args: [settings], next }) => {
                try {
                    return await next();
                } catch (cause) {
                    throw UnableToAcquireReaderSemaphoreError.create(
                        settings.key,
                        cause,
                    );
                }
            },
        );
        enhance(
            adapter,
            "releaseReader",
            async ({ args: [key, slotId], next }) => {
                try {
                    return await next();
                } catch (cause) {
                    throw UnableToReleaseReaderSemaphoreError.create(
                        key,
                        slotId,
                        cause,
                    );
                }
            },
        );
        enhance(
            adapter,
            "refreshReader",
            async ({ args: [key, slotId], next }) => {
                try {
                    return await next();
                } catch (cause) {
                    throw UnableToRefreshReaderSemaphoreError.create(
                        key,
                        slotId,
                        cause,
                    );
                }
            },
        );
        enhance(adapter, "forceRelease", async ({ args: [key], next }) => {
            try {
                return await next();
            } catch (cause) {
                throw UnableToForceReleaseSharedLockError.create(key, cause);
            }
        });
        enhance(adapter, "getState", async ({ args: [key], next }) => {
            try {
                return await next();
            } catch (cause) {
                throw UnableToGetStateSharedLockError.create(key, cause);
            }
        });
    };
}
