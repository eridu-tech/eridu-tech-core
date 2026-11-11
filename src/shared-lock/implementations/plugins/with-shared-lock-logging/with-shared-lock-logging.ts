/**
 * @module SharedLock
 */

import type { ILogger } from "@/logger/contracts/_module-exports.js";
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
 * @param logger - The logger that receives the entries. Only `debug` and
 * `error` are used.
 * @returns A middleware plugin that wraps an `ISharedLockAdapter`.
 *
 * IMPORT_PATH: `"eridu-tech/shared-lock/plugins"`
 * @group Plugins
 */
export function withSharedLockLogging(
    logger: ILogger,
): PluginFn<ISharedLockAdapter> {
    return (adapter, enhance, adapterName) => {
        enhance(adapter, "acquireReader", [
            async ({ args: [{ key, lockId, limit, ttl }], next }) => {
                try {
                    const hasAcquiredReader = await next();
                    logger.debug(["acquireReader succeeded"], {
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
                    logger.error(["acquireReader failed"], {
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
                    logger.debug(["acquireWriter succeeded"], {
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
                    logger.error(["acquireWriter failed"], {
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
                    logger.debug(["forceRelease succeeded"], {
                        group: "[SharedLock]",
                        metadata: {
                            adapter: adapterName,
                            key,
                            hasForceReleased,
                        },
                    });
                    return hasForceReleased;
                } catch (error: unknown) {
                    logger.error(["forceRelease failed"], {
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
                    logger.debug(["getState succeeded"], {
                        group: "[SharedLock]",
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
        enhance(adapter, "refreshReader", [
            async ({ args: [key, slotId, ttl], next }) => {
                try {
                    const hasRefreshedReader = await next();
                    logger.debug(["refreshReader succeeded"], {
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
                    logger.error(["refreshReader failed"], {
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
                    logger.debug(["refreshWriter succeeded"], {
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
                    logger.error(["refreshWriter failed"], {
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
                    logger.debug(["releaseReader succeeded"], {
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
                    logger.error(["releaseReader failed"], {
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
                    logger.debug(["releaseWriter succeeded"], {
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
                    logger.error(["releaseWriter failed"], {
                        error,
                    });
                    throw error;
                }
            },
        ]);
    };
}
