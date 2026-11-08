/**
 * @module CircuitBreaker
 */

import { getConstructorName } from "@/utilities/_module-exports.js";

import type { ICircuitBreakerAdapter } from "@/circuit-breaker/contracts/_module-exports.js";
import type { ILogger } from "@/logger/contracts/_module-exports.js";
import type {
    MiddlewareFn,
    PluginFn,
} from "@/middleware/contracts/_module-exports.js";

/**
 * Creates a plugin that logs every call made to a circuit breaker adapter.
 *
 * A successful call logs a `debug` entry, and a failed call logs an `error`
 * entry before the error is re-thrown unchanged. Entries are named
 * `circuit-breaker.<methodName> succeeded|failed`. On success the call arguments
 * and the returned value are merged into the metadata as
 * `circuit-breaker.args` and `circuit-breaker.result`, and every call runs inside
 * the `circuit-breaker.adapter` scoped metadata, which holds the adapter class
 * name.
 *
 * @param logger - The logger that receives the entries. Only `debug`, `error`, `scopedMetadata` and `putMetadata` are used.
 * @returns A middleware plugin that wraps an `ICircuitBreakerAdapter`.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/plugins"`
 * @group Plugins
 */
export function withCircuitBreakerLogging(
    logger: Pick<ILogger, "debug" | "error" | "scopedMetadata" | "putMetadata">,
): PluginFn<ICircuitBreakerAdapter> {
    return (adapter, enhance) => {
        async function logCall<TValue>(
            methodName: keyof ICircuitBreakerAdapter,
            args: Array<unknown>,
            invocable: () => Promise<TValue>,
        ): Promise<TValue> {
            const prefix = `circuit-breaker.${methodName}`;
            try {
                const result = await invocable();
                logger.putMetadata({
                    "circuit-breaker.args": args,
                    "circuit-breaker.result": result,
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
                { "circuit-breaker.adapter": getConstructorName(adapter) },
                next,
            );
        };
        enhance(adapter, "getState", [
            withMetadata,
            ({ args, next }) => logCall("getState", args, next),
        ]);
        enhance(adapter, "isolate", [
            withMetadata,
            ({ args, next }) => logCall("isolate", args, next),
        ]);
        enhance(adapter, "reset", [
            withMetadata,
            ({ args, next }) => logCall("reset", args, next),
        ]);
        enhance(adapter, "trackFailure", [
            withMetadata,
            ({ args, next }) => logCall("trackFailure", args, next),
        ]);
        enhance(adapter, "trackSuccess", [
            withMetadata,
            ({ args, next }) => logCall("trackSuccess", args, next),
        ]);
        enhance(adapter, "updateState", [
            withMetadata,
            ({ args, next }) => logCall("updateState", args, next),
        ]);
    };
}
