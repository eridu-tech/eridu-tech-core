/**
 * @module Lock
 */

import { getConstructorName } from "@/utilities/_module-exports.js";

import type { ILockAdapter } from "@/lock/contracts/_module-exports.js";
import type { ILogger } from "@/logger/contracts/_module-exports.js";
import type {
    MiddlewareFn,
    PluginFn,
} from "@/middleware/contracts/_module-exports.js";

/**
 * Creates a plugin that logs every call made to a lock adapter.
 *
 * A successful call logs a `debug` entry, and a failed call logs an `error`
 * entry before the error is re-thrown unchanged. Entries are named
 * `lock.<methodName> succeeded|failed`. On success the call arguments and the
 * returned value are merged into the metadata as `lock.args` and `lock.result`,
 * and every call runs inside the `lock.adapter` scoped metadata, which holds
 * the adapter class name.
 *
 * @param logger - The logger that receives the entries. Only `debug`, `error`, `scopedMetadata` and `putMetadata` are used.
 * @returns A middleware plugin that wraps an `ILockAdapter`.
 *
 * IMPORT_PATH: `"eridu-tech/lock/plugins"`
 * @group Plugins
 */
export function withLockLogging(
    logger: Pick<ILogger, "debug" | "error" | "scopedMetadata" | "putMetadata">,
): PluginFn<ILockAdapter> {
    return (adapter, enhance) => {
        async function logCall<TValue>(
            methodName: keyof ILockAdapter,
            args: Array<unknown>,
            invocable: () => Promise<TValue>,
        ): Promise<TValue> {
            const prefix = `lock.${methodName}`;
            try {
                const result = await invocable();
                logger.putMetadata({
                    "lock.args": args,
                    "lock.result": result,
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
                { "lock.adapter": getConstructorName(adapter) },
                next,
            );
        };
        enhance(adapter, "acquire", [
            withMetadata,
            ({ args, next }) => logCall("acquire", args, next),
        ]);
        enhance(adapter, "forceRelease", [
            withMetadata,
            ({ args, next }) => logCall("forceRelease", args, next),
        ]);
        enhance(adapter, "getState", [
            withMetadata,
            ({ args, next }) => logCall("getState", args, next),
        ]);
        enhance(adapter, "refresh", [
            withMetadata,
            ({ args, next }) => logCall("refresh", args, next),
        ]);
        enhance(adapter, "release", [
            withMetadata,
            ({ args, next }) => logCall("release", args, next),
        ]);
    };
}
