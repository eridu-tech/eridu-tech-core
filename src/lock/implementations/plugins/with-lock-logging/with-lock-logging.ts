/**
 * @module Lock
 */

import { getConstructorName } from "@/utilities/_module-exports.js";

import type { ILockAdapter } from "@/lock/contracts/_module-exports.js";
import type { ILogger } from "@/logger/contracts/_module-exports.js";
import type { PluginFn } from "@/middleware/contracts/_module-exports.js";

/**
 * Creates a plugin that logs every call made to a lock adapter.
 *
 * A successful call logs a `debug` entry, and a failed call logs an `error`
 * entry before the error is re-thrown unchanged. Entries are named
 * `<adapter class name>.<methodName> succeeded|failed` and carry the call
 * arguments as `args` together with either the returned value as `result` or
 * the thrown value as `error`. Arguments are logged as-is.
 *
 * @param logger - The logger that receives the entries. Only `debug` and `error` are used.
 * @returns A middleware plugin that wraps an `ILockAdapter`.
 *
 * IMPORT_PATH: `"eridu-tech/lock/plugins"`
 * @group Plugins
 */
export function withLockLogging(
    logger: Pick<ILogger, "debug" | "error">,
): PluginFn<ILockAdapter> {
    return (adapter, enhance) => {
        async function logCall<TValue>(
            methodName: keyof ILockAdapter,
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
        enhance(adapter, "acquire", ({ args, next }) =>
            logCall("acquire", args, next),
        );
        enhance(adapter, "forceRelease", ({ args, next }) =>
            logCall("forceRelease", args, next),
        );
        enhance(adapter, "getState", ({ args, next }) =>
            logCall("getState", args, next),
        );
        enhance(adapter, "refresh", ({ args, next }) =>
            logCall("refresh", args, next),
        );
        enhance(adapter, "release", ({ args, next }) =>
            logCall("release", args, next),
        );
    };
}
