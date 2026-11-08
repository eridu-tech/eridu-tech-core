/**
 * @module SharedLock
 */

import { getConstructorName } from "@/utilities/_module-exports.js";

import type { ILogger } from "@/logger/contracts/_module-exports.js";
import type {
    MiddlewareFn,
    PluginFn,
} from "@/middleware/contracts/_module-exports.js";
import type { ISharedLockAdapter } from "@/shared-lock/contracts/_module-exports.js";

/**
 * Creates a plugin that logs every call made to a shared lock adapter.
 *
 * A successful call logs a `debug` entry, and a failed call logs an `error`
 * entry before the error is re-thrown unchanged. Entries are named
 * `shared-lock.<methodName> succeeded|failed`. On success the call arguments
 * and the returned value are merged into the metadata as `shared-lock.args`
 * and `shared-lock.result`, and every call runs inside the
 * `shared-lock.adapter` scoped metadata, which holds the adapter class name.
 *
 * @param logger - The logger that receives the entries. Only `debug`, `error`, `scopedMetadata` and `putMetadata` are used.
 * @returns A middleware plugin that wraps an `ISharedLockAdapter`.
 *
 * IMPORT_PATH: `"eridu-tech/shared-lock/plugins"`
 * @group Plugins
 */
export function withSharedLockLogging(
    logger: Pick<ILogger, "debug" | "error" | "scopedMetadata" | "putMetadata">,
): PluginFn<ISharedLockAdapter> {
    return (adapter, enhance) => {
        async function logCall<TValue>(
            methodName: keyof ISharedLockAdapter,
            args: Array<unknown>,
            invocable: () => Promise<TValue>,
        ): Promise<TValue> {
            const prefix = `shared-lock.${methodName}`;
            try {
                const result = await invocable();
                logger.putMetadata({
                    "shared-lock.args": args,
                    "shared-lock.result": result,
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
                { "shared-lock.adapter": getConstructorName(adapter) },
                next,
            );
        };
        enhance(adapter, "acquireReader", [
            withMetadata,
            ({ args, next }) => logCall("acquireReader", args, next),
        ]);
        enhance(adapter, "acquireWriter", [
            withMetadata,
            ({ args, next }) => logCall("acquireWriter", args, next),
        ]);
        enhance(adapter, "forceRelease", [
            withMetadata,
            ({ args, next }) => logCall("forceRelease", args, next),
        ]);
        enhance(adapter, "getState", [
            withMetadata,
            ({ args, next }) => logCall("getState", args, next),
        ]);
        enhance(adapter, "refreshReader", [
            withMetadata,
            ({ args, next }) => logCall("refreshReader", args, next),
        ]);
        enhance(adapter, "refreshWriter", [
            withMetadata,
            ({ args, next }) => logCall("refreshWriter", args, next),
        ]);
        enhance(adapter, "releaseReader", [
            withMetadata,
            ({ args, next }) => logCall("releaseReader", args, next),
        ]);
        enhance(adapter, "releaseWriter", [
            withMetadata,
            ({ args, next }) => logCall("releaseWriter", args, next),
        ]);
    };
}
