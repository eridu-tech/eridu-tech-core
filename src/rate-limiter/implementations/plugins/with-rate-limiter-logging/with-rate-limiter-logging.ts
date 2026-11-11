/**
 * @module RateLimiter
 */

import type { ILogger } from "@/logger/contracts/_module-exports.js";
import type { PluginFn } from "@/middleware/contracts/_module-exports.js";
import type { IRateLimiterAdapter } from "@/rate-limiter/contracts/_module-exports.js";

/**
 * Creates a plugin that logs every call made to a rate limiter adapter.
 *
 * A successful call logs a `debug` entry, and a failed call logs an `error`
 * entry before the error is re-thrown unchanged. Entries are grouped under
 * `[RateLimiter]` and named after the method followed by `succeeded` or
 * `failed`. Successful entries carry the adapter class name, the call arguments
 * and, for value-returning methods, the returned state under `state`.
 *
 * @param logger - The logger that receives the entries. Only `debug` and
 * `error` are used.
 * @returns A middleware plugin that wraps an `IRateLimiterAdapter`.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/plugins"`
 * @group Plugins
 */
export function withRateLimiterLogging(
    logger: ILogger,
): PluginFn<IRateLimiterAdapter> {
    return (adapter, enhance, adapterName) => {
        enhance(adapter, "getState", [
            async ({ args: [key], next }) => {
                try {
                    const state = await next();
                    logger.debug(["getState succeeded"], {
                        group: "[RateLimiter]",
                        metadata: {
                            adapter: adapterName,
                            key,
                            state,
                        },
                    });
                    return state;
                } catch (error: unknown) {
                    logger.error(["getState failed"], {
                        error,
                    });
                    throw error;
                }
            },
        ]);
        enhance(adapter, "reset", [
            async ({ args: [key], next }) => {
                try {
                    await next();
                    logger.debug(["reset succeeded"], {
                        group: "[RateLimiter]",
                        metadata: {
                            adapter: adapterName,
                            key,
                        },
                    });
                } catch (error: unknown) {
                    logger.error(["reset failed"], {
                        error,
                    });
                    throw error;
                }
            },
        ]);
        enhance(adapter, "updateState", [
            async ({ args: [key, limit], next }) => {
                try {
                    const state = await next();
                    logger.debug(["updateState succeeded"], {
                        group: "[RateLimiter]",
                        metadata: {
                            adapter: adapterName,
                            key,
                            limit,
                            state,
                        },
                    });
                    return state;
                } catch (error: unknown) {
                    logger.error(["updateState failed"], {
                        error,
                    });
                    throw error;
                }
            },
        ]);
    };
}
