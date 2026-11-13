/**
 * @module Semaphore
 */

import type { ILog } from "@/log/contracts/_module-exports.js";
import type { PluginFn } from "@/middleware/contracts/_module-exports.js";
import type { ISemaphoreAdapter } from "@/semaphore/contracts/_module-exports.js";

/**
 * Creates a plugin that logs every call made to a semaphore adapter.
 *
 * A successful call logs a `debug` entry, and a failed call logs an `error`
 * entry before the error is re-thrown unchanged. Entries are grouped under
 * `[Semaphore]` and named after the method followed by `succeeded` or `failed`.
 * Successful entries carry the adapter class name, the call arguments and, for
 * value-returning methods, the outcome under a `has...` key or the returned
 * `state`.
 *
 * @param log - The log that receives the entries. Only `debug` and
 * `error` are used.
 * @returns A middleware plugin that wraps an `ISemaphoreAdapter`.
 *
 * IMPORT_PATH: `"eridu-tech/semaphore/plugins"`
 * @group Plugins
 */
export function withSemaphoreLogging(log: ILog): PluginFn<ISemaphoreAdapter> {
    return (adapter, enhance, adapterName) => {
        enhance(adapter, "acquire", [
            async ({ args: [{ key, slotId, limit, ttl }], next }) => {
                try {
                    const hasAcquired = await next();
                    log.debug(["acquire succeeded"], {
                        group: "[Semaphore]",
                        metadata: {
                            adapter: adapterName,
                            key,
                            slotId,
                            limit,
                            ttl,
                            hasAcquired,
                        },
                    });
                    return hasAcquired;
                } catch (error: unknown) {
                    log.error(["acquire failed"], {
                        error,
                    });
                    throw error;
                }
            },
        ]);
        enhance(adapter, "forceReleaseAll", [
            async ({ args: [key], next }) => {
                try {
                    const hasForceReleasedAll = await next();
                    log.debug(["forceReleaseAll succeeded"], {
                        group: "[Semaphore]",
                        metadata: {
                            adapter: adapterName,
                            key,
                            hasForceReleasedAll,
                        },
                    });
                    return hasForceReleasedAll;
                } catch (error: unknown) {
                    log.error(["forceReleaseAll failed"], {
                        error,
                    });
                    throw error;
                }
            },
        ]);
        enhance(adapter, "getState", [
            async ({ args: [key], next }) => {
                try {
                    const state = await next();
                    log.debug(["getState succeeded"], {
                        group: "[Semaphore]",
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
        enhance(adapter, "refresh", [
            async ({ args: [key, slotId, ttl], next }) => {
                try {
                    const hasRefreshed = await next();
                    log.debug(["refresh succeeded"], {
                        group: "[Semaphore]",
                        metadata: {
                            adapter: adapterName,
                            key,
                            slotId,
                            ttl,
                            hasRefreshed,
                        },
                    });
                    return hasRefreshed;
                } catch (error: unknown) {
                    log.error(["refresh failed"], {
                        error,
                    });
                    throw error;
                }
            },
        ]);
        enhance(adapter, "release", [
            async ({ args: [key, slotId], next }) => {
                try {
                    const hasReleased = await next();
                    log.debug(["release succeeded"], {
                        group: "[Semaphore]",
                        metadata: {
                            adapter: adapterName,
                            key,
                            slotId,
                            hasReleased,
                        },
                    });
                    return hasReleased;
                } catch (error: unknown) {
                    log.error(["release failed"], {
                        error,
                    });
                    throw error;
                }
            },
        ]);
    };
}
