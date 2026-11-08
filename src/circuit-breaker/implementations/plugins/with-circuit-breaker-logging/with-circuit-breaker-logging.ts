/**
 * @module CircuitBreaker
 */

import { getConstructorName } from "@/utilities/_module-exports.js";

import type { ICircuitBreakerAdapter } from "@/circuit-breaker/contracts/_module-exports.js";
import type { ILogger } from "@/logger/contracts/_module-exports.js";
import type { PluginFn } from "@/middleware/contracts/_module-exports.js";

/**
 * Creates a plugin that logs every call made to a circuit breaker adapter.
 *
 * A successful call logs a `debug` entry, and a failed call logs an `error`
 * entry before the error is re-thrown unchanged. Entries are named
 * `<adapter class name>.<methodName> succeeded|failed` and carry the call
 * arguments as `args` together with either the returned value as `result` or
 * the thrown value as `error`. Arguments are logged as-is.
 *
 * @param logger - The logger that receives the entries. Only `debug` and `error` are used.
 * @returns A middleware plugin that wraps an `ICircuitBreakerAdapter`.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/plugins"`
 * @group Plugins
 */
export function withCircuitBreakerLogging(
    logger: Pick<ILogger, "debug" | "error">,
): PluginFn<ICircuitBreakerAdapter> {
    return (adapter, enhance) => {
        async function logCall<TValue>(
            methodName: keyof ICircuitBreakerAdapter,
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
        enhance(adapter, "getState", ({ args, next }) =>
            logCall("getState", args, next),
        );
        enhance(adapter, "isolate", ({ args, next }) =>
            logCall("isolate", args, next),
        );
        enhance(adapter, "reset", ({ args, next }) =>
            logCall("reset", args, next),
        );
        enhance(adapter, "trackFailure", ({ args, next }) =>
            logCall("trackFailure", args, next),
        );
        enhance(adapter, "trackSuccess", ({ args, next }) =>
            logCall("trackSuccess", args, next),
        );
        enhance(adapter, "updateState", ({ args, next }) =>
            logCall("updateState", args, next),
        );
    };
}
