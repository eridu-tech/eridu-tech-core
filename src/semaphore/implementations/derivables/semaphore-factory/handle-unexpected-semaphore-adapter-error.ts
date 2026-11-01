/**
 * @module Semaphore
 */

import {
    UnableToAcquireSemaphoreError,
    UnableToForceReleaseAllSemaphoreError,
    UnableToGetStateSemaphoreError,
    UnableToRefreshSemaphoreError,
    UnableToReleaseSemaphoreError,
} from "@/semaphore/contracts/_module-exports.js";

import type { PluginFn } from "@/middleware/contracts/_module-exports.js";
import type { ISemaphoreAdapter } from "@/semaphore/contracts/_module-exports.js";

/**
 * Creates a plugin that converts unexpected errors thrown by a semaphore adapter into `UnableTo*SemaphoreError` errors.
 *
 * Every method of the wrapped `ISemaphoreAdapter` is wrapped in a `try`/`catch` block,
 * and the original error is preserved as the `cause` of the matching error:
 * - `acquire` throws {@link UnableToAcquireSemaphoreError | `UnableToAcquireSemaphoreError`}
 * - `release` throws {@link UnableToReleaseSemaphoreError | `UnableToReleaseSemaphoreError`}
 * - `forceReleaseAll` throws {@link UnableToForceReleaseAllSemaphoreError | `UnableToForceReleaseAllSemaphoreError`}
 * - `refresh` throws {@link UnableToRefreshSemaphoreError | `UnableToRefreshSemaphoreError`}
 * - `getState` throws {@link UnableToGetStateSemaphoreError | `UnableToGetStateSemaphoreError`}
 *
 * Apply it with `withPlugin`:
 * ```ts
 * import {
 *     SemaphoreFactory,
 *     handleUnexpectedSemaphoreAdapterError,
 * } from "eridu-tech/semaphore";
 * import { withPlugin } from "eridu-tech/middleware";
 *
 * const semaphoreFactory = new SemaphoreFactory({
 *     adapter: withPlugin(
 *         adapter,
 *         handleUnexpectedSemaphoreAdapterError(),
 *     ),
 * });
 * ```
 *
 * @returns A middleware plugin that wraps an `ISemaphoreAdapter`.
 *
 * IMPORT_PATH: `"eridu-tech/semaphore"`
 * @group Derivables
 * @internal
 */
export function handleUnexpectedSemaphoreAdapterError(): PluginFn<ISemaphoreAdapter> {
    return (adapter, enhance) => {
        enhance(adapter, "acquire", async ({ args: [settings], next }) => {
            try {
                return await next();
            } catch (cause) {
                throw UnableToAcquireSemaphoreError.create(settings.key, cause);
            }
        });
        enhance(adapter, "release", async ({ args: [key, slotId], next }) => {
            try {
                return await next();
            } catch (cause) {
                throw UnableToReleaseSemaphoreError.create(key, slotId, cause);
            }
        });
        enhance(adapter, "forceReleaseAll", async ({ args: [key], next }) => {
            try {
                return await next();
            } catch (cause) {
                throw UnableToForceReleaseAllSemaphoreError.create(key, cause);
            }
        });
        enhance(adapter, "refresh", async ({ args: [key, slotId], next }) => {
            try {
                return await next();
            } catch (cause) {
                throw UnableToRefreshSemaphoreError.create(key, slotId, cause);
            }
        });
        enhance(adapter, "getState", async ({ args: [key], next }) => {
            try {
                return await next();
            } catch (cause) {
                throw UnableToGetStateSemaphoreError.create(key, cause);
            }
        });
    };
}
