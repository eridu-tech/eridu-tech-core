/**
 * @module FileStorage
 */

import { getConstructorName } from "@/utilities/_module-exports.js";

import type { IFileStorageAdapter } from "@/file-storage/contracts/_module-exports.js";
import type { ILogger } from "@/logger/contracts/_module-exports.js";
import type {
    MiddlewareFn,
    PluginFn,
} from "@/middleware/contracts/_module-exports.js";

/**
 * Creates a plugin that logs every call made to a file storage adapter.
 *
 * A successful call logs a `debug` entry, and a failed call logs an `error`
 * entry before the error is re-thrown unchanged. Entries are named
 * `fileStorage.<methodName> succeeded|failed`. On success the logged arguments
 * and the returned value are merged into the metadata as `fileStorage.args` and
 * `fileStorage.result`; `put` and `putStream` drop the `data` payload there, so
 * file bytes never reach the logger. Every call runs inside the
 * `fileStorage.adapter` scoped metadata, which holds the adapter class name.
 *
 * @param logger - The logger that receives the entries. Only `debug`, `error`, `scopedMetadata` and `putMetadata` are used.
 * @returns A middleware plugin that wraps an `IFileStorageAdapter`.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/plugins"`
 * @group Plugins
 */
export function withFileStorageLogging(
    logger: Pick<ILogger, "debug" | "error" | "scopedMetadata" | "putMetadata">,
): PluginFn<IFileStorageAdapter> {
    return (adapter, enhance) => {
        async function logCall<TValue>(
            methodName: keyof IFileStorageAdapter,
            args: Array<unknown>,
            invocable: () => Promise<TValue>,
        ): Promise<TValue> {
            const prefix = `fileStorage.${methodName}`;
            try {
                const result = await invocable();
                logger.putMetadata({
                    "fileStorage.args": args,
                    "fileStorage.result": result,
                });
                logger.debug(`${prefix} succeeded`);
                return result;
            } catch (error: unknown) {
                logger.error(`${prefix} failed`);
                throw error;
            }
        }
        const withMetadata: MiddlewareFn<any, any> = ({ next }) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            return logger.scopedMetadata(
                { "fileStorage.adapter": getConstructorName(adapter) },
                next,
            );
        };
        enhance(adapter, "copy", [
            withMetadata,
            ({ args, next }) => logCall("copy", args, next),
        ]);
        enhance(adapter, "exists", [
            withMetadata,
            ({ args, next }) => logCall("exists", args, next),
        ]);
        enhance(adapter, "getBytes", [
            withMetadata,
            ({ args, next }) => logCall("getBytes", args, next),
        ]);
        enhance(adapter, "getMetaData", [
            withMetadata,
            ({ args, next }) => logCall("getMetaData", args, next),
        ]);
        enhance(adapter, "getStream", [
            withMetadata,
            ({ args, next }) => logCall("getStream", args, next),
        ]);
        enhance(adapter, "move", [
            withMetadata,
            ({ args, next }) => logCall("move", args, next),
        ]);
        enhance(adapter, "put", [
            withMetadata,
            ({ args: [key, { data: _, ...rest }], next }) =>
                logCall("put", [key, rest], next),
        ]);
        enhance(adapter, "putStream", [
            withMetadata,
            ({ args: [key, { data: _, ...rest }], next }) =>
                logCall("putStream", [key, rest], next),
        ]);
        enhance(adapter, "removeByPrefix", [
            withMetadata,
            ({ args, next }) => logCall("removeByPrefix", args, next),
        ]);
        enhance(adapter, "removeMany", [
            withMetadata,
            ({ args, next }) => logCall("removeMany", args, next),
        ]);
    };
}
