/**
 * @module RateLimiter
 */

import {
    UnableToGetStateRateLimiterError,
    UnableToResetRateLimiterError,
    UnableToUpdateStateRateLimiterError,
} from "@/rate-limiter/contracts/_module-exports.js";

import type { PluginFn } from "@/middleware/contracts/_module-exports.js";
import type { IRateLimiterAdapter } from "@/rate-limiter/contracts/_module-exports.js";

/**
 * Creates a plugin that converts unexpected errors thrown by a rate limiter adapter into `UnableTo*RateLimiterError` errors.
 *
 * Every method of the wrapped `IRateLimiterAdapter` is wrapped in a `try`/`catch` block,
 * and the original error is preserved as the `cause` of the matching error:
 * - `getState` throws {@link UnableToGetStateRateLimiterError | `UnableToGetStateRateLimiterError`}
 * - `updateState` throws {@link UnableToUpdateStateRateLimiterError | `UnableToUpdateStateRateLimiterError`}
 * - `reset` throws {@link UnableToResetRateLimiterError | `UnableToResetRateLimiterError`}
 *
 * @returns A middleware plugin that wraps an `IRateLimiterAdapter`.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter"`
 * @group Derivables
 * @internal
 */
export function handleUnexpectedRateLimiterAdapterError(): PluginFn<IRateLimiterAdapter> {
    return (adapter, enhance) => {
        enhance(adapter, "getState", async ({ args: [key], next }) => {
            try {
                return await next();
            } catch (cause) {
                throw UnableToGetStateRateLimiterError.create(key, cause);
            }
        });
        enhance(adapter, "updateState", async ({ args: [key], next }) => {
            try {
                return await next();
            } catch (cause) {
                throw UnableToUpdateStateRateLimiterError.create(key, cause);
            }
        });
        enhance(adapter, "reset", async ({ args: [key], next }) => {
            try {
                await next();
                return;
            } catch (cause) {
                throw UnableToResetRateLimiterError.create(key, cause);
            }
        });
    };
}
