/**
 * @module RateLimiter
 */

import type { ILog } from "@/log/contracts/_module-exports.js";
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
 * @param log - The log that receives the entries. Only `debug` and
 * `error` are used.
 * @returns A middleware plugin that wraps an `IRateLimiterAdapter`.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/plugins"`
 * @group Plugins
 */
export function withRateLimiterLogging(
    log: ILog,
): PluginFn<IRateLimiterAdapter> {
    return (adapter, enhance, adapterName) => {
        enhance(adapter, "getState", [
            async ({ args: [key], next }) => {
                try {
                    const state = await next();
                    log.debug(["getState succeeded"], {
                        group: "[RateLimiter]",
                        metadata: {
                            adapter: adapterName,
                            key,
                            state,
                        },
                    });
                    return state;
                } catch (error: unknown) {
                    log.error(["getState failed"], {
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
                    log.debug(["reset succeeded"], {
                        group: "[RateLimiter]",
                        metadata: {
                            adapter: adapterName,
                            key,
                        },
                    });
                } catch (error: unknown) {
                    log.error(["reset failed"], {
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
                    log.debug(["updateState succeeded"], {
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
                    log.error(["updateState failed"], {
                        error,
                    });
                    throw error;
                }
            },
        ]);
    };
}
