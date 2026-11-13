/**
 * @module Lock
 */

import type { ILockAdapter } from "@/lock/contracts/_module-exports.js";
import type { ILog } from "@/log/contracts/_module-exports.js";
import type { PluginFn } from "@/middleware/contracts/_module-exports.js";

/**
 * Creates a plugin that logs every call made to a lock adapter.
 *
 * A successful call logs a `debug` entry, and a failed call logs an `error`
 * entry before the error is re-thrown unchanged. Entries are grouped under
 * `[Lock]` and named after the method followed by `succeeded` or `failed`.
 * Successful entries carry the adapter class name, the call arguments and, for
 * value-returning methods, the result under `result` or `state`.
 *
 * @param log - The log that receives the entries. Only `debug` and
 * `error` are used.
 * @returns A middleware plugin that wraps an `ILockAdapter`.
 *
 * IMPORT_PATH: `"eridu-tech/lock/plugins"`
 * @group Plugins
 */
export function withLockLogging(log: ILog): PluginFn<ILockAdapter> {
    return (adapter, enhance, adapterName) => {
        enhance(adapter, "acquire", [
            async ({ args: [key, lockId, ttl], next }) => {
                try {
                    const hasAcquired = await next();
                    log.debug(["acquire succeeded"], {
                        group: "[Lock]",
                        metadata: {
                            adapter: adapterName,
                            key,
                            lockId,
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
        enhance(adapter, "forceRelease", [
            async ({ args: [key], next }) => {
                try {
                    const hasForceReleased = await next();
                    log.debug(["forceRelease succeeded"], {
                        group: "[Lock]",
                        metadata: {
                            adapter: adapterName,
                            key,
                            hasForceReleased,
                        },
                    });
                    return hasForceReleased;
                } catch (error: unknown) {
                    log.error(["forceRelease failed"], {
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
                        group: "[Lock]",
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
            async ({ args: [key, lockId, ttl], next }) => {
                try {
                    const hasRefreshed = await next();
                    log.debug(["refresh succeeded"], {
                        group: "[Lock]",
                        metadata: {
                            adapter: adapterName,
                            key,
                            lockId,
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
            async ({ args: [key, lockId], next }) => {
                try {
                    const hasReleased = await next();
                    log.debug(["release succeeded"], {
                        group: "[Lock]",
                        metadata: {
                            adapter: adapterName,
                            key,
                            lockId,
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
