/**
 * @module FileStorage
 */

import { getConstructorName } from "@/utilities/_module-exports.js";

import type { IFileStorageAdapter } from "@/file-storage/contracts/_module-exports.js";
import type { ILogger } from "@/logger/contracts/_module-exports.js";
import type { PluginFn } from "@/middleware/contracts/_module-exports.js";

/**
 * Creates a plugin that logs every call made to a file storage adapter.
 *
 * A successful call logs a `debug` entry, and a failed call logs an `error`
 * entry before the error is re-thrown unchanged. Entries are named
 * `<adapter class name>.<methodName> succeeded|failed` and carry the call
 * arguments as `args` together with either the returned value as `result` or
 * the thrown value as `error`. `put` and `putStream` drop the `data` payload and
 * log the file key with the remaining settings, so file bytes never reach the
 * logger.
 *
 * @param logger - The logger that receives the entries. Only `debug` and `error` are used.
 * @returns A middleware plugin that wraps an `IFileStorageAdapter`.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/plugins"`
 * @group Plugins
 */
export function withFileStorageLogging(
    logger: Pick<ILogger, "debug" | "error">,
): PluginFn<IFileStorageAdapter> {
    return (adapter, enhance) => {
        async function logCall<TValue>(
            methodName: keyof IFileStorageAdapter,
            args: Array<unknown>,
            invocable: () => Promise<TValue>,
        ): Promise<TValue> {
            const prefix = `${getConstructorName(adapter)}.${methodName}`;
            try {
                const result = await invocable();
                logger.debug(`${prefix} succeeded`, { args, result });
                return result;
            } catch (error: unknown) {
                logger.error(`${prefix} failed`, { args, error });
                throw error;
            }
        }
        enhance(adapter, "copy", ({ args, next }) =>
            logCall("copy", args, next),
        );
        enhance(adapter, "exists", ({ args, next }) =>
            logCall("exists", args, next),
        );
        enhance(adapter, "getBytes", ({ args, next }) =>
            logCall("getBytes", args, next),
        );
        enhance(adapter, "getMetaData", ({ args, next }) =>
            logCall("getMetaData", args, next),
        );
        enhance(adapter, "getStream", ({ args, next }) =>
            logCall("getStream", args, next),
        );
        enhance(adapter, "move", ({ args, next }) =>
            logCall("move", args, next),
        );
        enhance(adapter, "put", ({ args: [key, { data: _, ...rest }], next }) =>
            logCall("put", [key, rest], next),
        );
        enhance(
            adapter,
            "putStream",
            ({ args: [key, { data: _, ...rest }], next }) =>
                logCall("putStream", [key, rest], next),
        );
        enhance(adapter, "removeByPrefix", ({ args, next }) =>
            logCall("removeByPrefix", args, next),
        );
        enhance(adapter, "removeMany", ({ args, next }) =>
            logCall("removeMany", args, next),
        );
    };
}
