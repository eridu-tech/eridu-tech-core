/**
 * @module FileStorage
 */

import type { IFileStorageAdapter } from "@/file-storage/contracts/_module-exports.js";
import type { ILog } from "@/log/contracts/_module-exports.js";
import type { PluginFn } from "@/middleware/contracts/_module-exports.js";

/**
 * Creates a plugin that logs every call made to a file storage adapter.
 *
 * A successful call logs a `debug` entry, and a failed call logs an `error`
 * entry before the error is re-thrown unchanged. Entries are grouped under
 * `[FileStorage]` and named after the method followed by `succeeded` or
 * `failed`. Successful entries carry the adapter class name, the logged
 * arguments and, for value-returning methods, the result. `put` and `putStream`
 * drop the `data` payload, and `getBytes` and `getStream` omit the returned
 * bytes or stream so file contents never reach the log.
 *
 * @param log - The log that receives the entries. Only `debug` and
 * `error` are used.
 * @returns A middleware plugin that wraps an `IFileStorageAdapter`.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/plugins"`
 * @group Plugins
 */
export function withFileStorageLogging(
    log: ILog,
): PluginFn<IFileStorageAdapter> {
    return (adapter, enhance, adapterName) => {
        enhance(adapter, "copy", [
            async ({ args: [source, destination], next }) => {
                try {
                    const result = await next();
                    log.debug(["copy succeeded"], {
                        group: "[FileStorage]",
                        metadata: {
                            adapter: adapterName,
                            source,
                            destination,
                            result,
                        },
                    });
                    return result;
                } catch (error: unknown) {
                    log.error(["copy failed"], {
                        error,
                    });
                    throw error;
                }
            },
        ]);
        enhance(adapter, "exists", [
            async ({ args: [key], next }) => {
                try {
                    const result = await next();
                    log.debug(["exists succeeded"], {
                        group: "[FileStorage]",
                        metadata: {
                            adapter: adapterName,
                            key,
                            result,
                        },
                    });
                    return result;
                } catch (error: unknown) {
                    log.error(["exists failed"], {
                        error,
                    });
                    throw error;
                }
            },
        ]);
        enhance(adapter, "getBytes", [
            async ({ args: [key], next }) => {
                try {
                    const result = await next();
                    log.debug(["getBytes succeeded"], {
                        group: "[FileStorage]",
                        metadata: {
                            adapter: adapterName,
                            key,
                        },
                    });
                    return result;
                } catch (error: unknown) {
                    log.error(["getBytes failed"], {
                        error,
                    });
                    throw error;
                }
            },
        ]);
        enhance(adapter, "getMetaData", [
            async ({ args: [key], next }) => {
                try {
                    const result = await next();
                    log.debug(["getMetaData succeeded"], {
                        group: "[FileStorage]",
                        metadata: {
                            adapter: adapterName,
                            key,
                            metadata: result,
                        },
                    });
                    return result;
                } catch (error: unknown) {
                    log.error(["getMetaData failed"], {
                        error,
                    });
                    throw error;
                }
            },
        ]);
        enhance(adapter, "getStream", [
            async ({ args: [key], next }) => {
                try {
                    const result = await next();
                    log.debug(["getStream succeeded"], {
                        group: "[FileStorage]",
                        metadata: {
                            adapter: adapterName,
                            key,
                        },
                    });
                    return result;
                } catch (error: unknown) {
                    log.error(["getStream failed"], {
                        error,
                    });
                    throw error;
                }
            },
        ]);
        enhance(adapter, "move", [
            async ({ args: [source, destination], next }) => {
                try {
                    const result = await next();
                    log.debug(["move succeeded"], {
                        group: "[FileStorage]",
                        metadata: {
                            adapter: adapterName,
                            source,
                            destination,
                            result,
                        },
                    });
                    return result;
                } catch (error: unknown) {
                    log.error(["move failed"], {
                        error,
                    });
                    throw error;
                }
            },
        ]);
        enhance(adapter, "put", [
            async ({ args: [key, { data: _, ...content }], next }) => {
                try {
                    await next();
                    log.debug(["put succeeded"], {
                        group: "[FileStorage]",
                        metadata: {
                            adapter: adapterName,
                            key,
                            content,
                        },
                    });
                } catch (error: unknown) {
                    log.error(["put failed"], {
                        error,
                    });
                    throw error;
                }
            },
        ]);
        enhance(adapter, "putStream", [
            async ({ args: [key, { data: _, ...stream }], next }) => {
                try {
                    await next();
                    log.debug(["putStream succeeded"], {
                        group: "[FileStorage]",
                        metadata: {
                            adapter: adapterName,
                            key,
                            stream,
                        },
                    });
                } catch (error: unknown) {
                    log.error(["putStream failed"], {
                        error,
                    });
                    throw error;
                }
            },
        ]);
        enhance(adapter, "removeByPrefix", [
            async ({ args: [prefix], next }) => {
                try {
                    await next();
                    log.debug(["removeByPrefix succeeded"], {
                        group: "[FileStorage]",
                        metadata: {
                            adapter: adapterName,
                            prefix,
                        },
                    });
                } catch (error: unknown) {
                    log.error(["removeByPrefix failed"], {
                        error,
                    });
                    throw error;
                }
            },
        ]);
        enhance(adapter, "removeMany", [
            async ({ args: [keys], next }) => {
                try {
                    await next();
                    log.debug(["removeMany succeeded"], {
                        group: "[FileStorage]",
                        metadata: {
                            adapter: adapterName,
                            keys,
                        },
                    });
                } catch (error: unknown) {
                    log.error(["removeMany failed"], {
                        error,
                    });
                    throw error;
                }
            },
        ]);
    };
}
