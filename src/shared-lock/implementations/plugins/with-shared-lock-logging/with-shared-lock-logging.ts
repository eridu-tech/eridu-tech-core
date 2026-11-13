/**
 * @module SharedLock
 */

import type { ILog } from "@/log/contracts/_module-exports.js";
import type { PluginFn } from "@/middleware/contracts/_module-exports.js";
import type { ISharedLockAdapter } from "@/shared-lock/contracts/_module-exports.js";

/**
 * Creates a plugin that logs every call made to a shared lock adapter.
 *
 * A successful call logs a `debug` entry, and a failed call logs an `error`
 * entry before the error is re-thrown unchanged. Entries are grouped under
 * `[SharedLock]` and named after the method followed by `succeeded` or
 * `failed`. Successful entries carry the adapter class name, the call arguments
 * and, for value-returning methods, the outcome under a `has...` key or the
 * returned `state`.
 *
 * @param log - The log that receives the entries. Only `debug` and
 * `error` are used.
 * @returns A middleware plugin that wraps an `ISharedLockAdapter`.
 *
 * IMPORT_PATH: `"eridu-tech/shared-lock/plugins"`
 * @group Plugins
 */
export function withSharedLockLogging(log: ILog): PluginFn<ISharedLockAdapter> {
    return (adapter, enhance, adapterName) => {
        enhance(adapter, "acquireReader", [
            async ({ args: [{ key, lockId, limit, ttl }], next }) => {
                try {
                    const hasAcquiredReader = await next();
                    log.debug(["acquireReader succeeded"], {
                        group: "[SharedLock]",
                        metadata: {
                            adapter: adapterName,
                            key,
                            lockId,
                            limit,
                            ttl,
                            hasAcquiredReader,
                        },
                    });
                    return hasAcquiredReader;
                } catch (error: unknown) {
                    log.error(["acquireReader failed"], {
                        error,
                    });
                    throw error;
                }
            },
        ]);
        enhance(adapter, "acquireWriter", [
            async ({ args: [key, lockId, ttl], next }) => {
                try {
                    const hasAcquiredWriter = await next();
                    log.debug(["acquireWriter succeeded"], {
                        group: "[SharedLock]",
                        metadata: {
                            adapter: adapterName,
                            key,
                            lockId,
                            ttl,
                            hasAcquiredWriter,
                        },
                    });
                    return hasAcquiredWriter;
                } catch (error: unknown) {
                    log.error(["acquireWriter failed"], {
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
                        group: "[SharedLock]",
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
                        group: "[SharedLock]",
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
        enhance(adapter, "refreshReader", [
            async ({ args: [key, slotId, ttl], next }) => {
                try {
                    const hasRefreshedReader = await next();
                    log.debug(["refreshReader succeeded"], {
                        group: "[SharedLock]",
                        metadata: {
                            adapter: adapterName,
                            key,
                            slotId,
                            ttl,
                            hasRefreshedReader,
                        },
                    });
                    return hasRefreshedReader;
                } catch (error: unknown) {
                    log.error(["refreshReader failed"], {
                        error,
                    });
                    throw error;
                }
            },
        ]);
        enhance(adapter, "refreshWriter", [
            async ({ args: [key, lockId, ttl], next }) => {
                try {
                    const hasRefreshedWriter = await next();
                    log.debug(["refreshWriter succeeded"], {
                        group: "[SharedLock]",
                        metadata: {
                            adapter: adapterName,
                            key,
                            lockId,
                            ttl,
                            hasRefreshedWriter,
                        },
                    });
                    return hasRefreshedWriter;
                } catch (error: unknown) {
                    log.error(["refreshWriter failed"], {
                        error,
                    });
                    throw error;
                }
            },
        ]);
        enhance(adapter, "releaseReader", [
            async ({ args: [key, slotId], next }) => {
                try {
                    const hasReleasedReader = await next();
                    log.debug(["releaseReader succeeded"], {
                        group: "[SharedLock]",
                        metadata: {
                            adapter: adapterName,
                            key,
                            slotId,
                            hasReleasedReader,
                        },
                    });
                    return hasReleasedReader;
                } catch (error: unknown) {
                    log.error(["releaseReader failed"], {
                        error,
                    });
                    throw error;
                }
            },
        ]);
        enhance(adapter, "releaseWriter", [
            async ({ args: [key, lockId], next }) => {
                try {
                    const hasReleasedWriter = await next();
                    log.debug(["releaseWriter succeeded"], {
                        group: "[SharedLock]",
                        metadata: {
                            adapter: adapterName,
                            key,
                            lockId,
                            hasReleasedWriter,
                        },
                    });
                    return hasReleasedWriter;
                } catch (error: unknown) {
                    log.error(["releaseWriter failed"], {
                        error,
                    });
                    throw error;
                }
            },
        ]);
    };
}
