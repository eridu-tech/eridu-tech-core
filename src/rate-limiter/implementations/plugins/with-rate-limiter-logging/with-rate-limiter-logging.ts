/**
 * @module RateLimiter
 */

import { getConstructorName } from "@/utilities/_module-exports.js";

import type { ILogger } from "@/logger/contracts/_module-exports.js";
import type {
    MiddlewareFn,
    PluginFn,
} from "@/middleware/contracts/_module-exports.js";
import type { IRateLimiterAdapter } from "@/rate-limiter/contracts/_module-exports.js";

/**
 * Creates a plugin that logs every call made to a rate limiter adapter.
 *
 * A successful call logs a `debug` entry, and a failed call logs an `error`
 * entry before the error is re-thrown unchanged. Entries are named
 * `rate-limiter.<methodName> succeeded|failed`. On success the call arguments
 * and the returned value are merged into the metadata as `rate-limiter.args` and
 * `rate-limiter.result`, and every call runs inside the `rate-limiter.adapter`
 * scoped metadata, which holds the adapter class name.
 *
 * @param logger - The logger that receives the entries. Only `debug`, `error`, `scopedMetadata` and `putMetadata` are used.
 * @returns A middleware plugin that wraps an `IRateLimiterAdapter`.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/plugins"`
 * @group Plugins
 */
export function withRateLimiterLogging(
    logger: Pick<ILogger, "debug" | "error" | "scopedMetadata" | "putMetadata">,
): PluginFn<IRateLimiterAdapter> {
    return (adapter, enhance) => {
        async function logCall<TValue>(
            methodName: keyof IRateLimiterAdapter,
            args: Array<unknown>,
            invocable: () => Promise<TValue>,
        ): Promise<TValue> {
            const prefix = `rate-limiter.${methodName}`;
            try {
                const result = await invocable();
                logger.putMetadata({
                    "rate-limiter.args": args,
                    "rate-limiter.result": result,
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
                { "rate-limiter.adapter": getConstructorName(adapter) },
                next,
            );
        };
        enhance(adapter, "getState", [
            withMetadata,
            ({ args, next }) => logCall("getState", args, next),
        ]);
        enhance(adapter, "reset", [
            withMetadata,
            ({ args, next }) => logCall("reset", args, next),
        ]);
        enhance(adapter, "updateState", [
            withMetadata,
            ({ args, next }) => logCall("updateState", args, next),
        ]);
    };
}
