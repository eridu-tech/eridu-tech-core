/**
 * @module CircuitBreaker
 */

import type { ICircuitBreakerAdapter } from "@/circuit-breaker/contracts/_module-exports.js";
import type { ILogger } from "@/logger/contracts/_module-exports.js";
import type { PluginFn } from "@/middleware/contracts/_module-exports.js";

/**
 * Creates a plugin that logs every call made to a circuit breaker adapter.
 *
 * A successful call logs a `debug` entry, and a failed call logs an `error`
 * entry before the error is re-thrown unchanged. Entries are named
 * `circuit-breaker.<methodName> succeeded|failed`. On success the call arguments
 * and the returned value are merged into the metadata as
 * `circuit-breaker.args` and `circuit-breaker.result`.
 *
 * @param logger - The logger that receives the entries. Only `debug`, `error` and `putMetadata` are used.
 * @returns A middleware plugin that wraps an `ICircuitBreakerAdapter`.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/plugins"`
 * @group Plugins
 */
export function withCircuitBreakerLogging(
    logger: Pick<ILogger, "debug" | "error">,
): PluginFn<ICircuitBreakerAdapter> {
    return (adapter, enhance, adapterName) => {
        enhance(adapter, "getState", [
            async ({ args: [key], next }) => {
                try {
                    const state = await next();
                    logger.debug(["getState succeeded"], {
                        group: "[CircuitBreaker]",
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
        enhance(adapter, "isolate", [
            async ({ args: [key], next }) => {
                try {
                    await next();
                    logger.debug(["isolate succeeded"], {
                        group: "[CircuitBreaker]",
                        metadata: {
                            adapter: adapterName,
                            key,
                        },
                    });
                } catch (error: unknown) {
                    logger.error(["isolate failed"], {
                        error,
                    });
                    throw error;
                }
            },
        ]);
        enhance(adapter, "reset", [
            async ({ args: [key], next }) => {
                try {
                    await next();
                    logger.debug(["reset succeeded"], {
                        group: "[CircuitBreaker]",
                        metadata: {
                            adapter: adapterName,
                            key,
                        },
                    });
                } catch (error: unknown) {
                    logger.error(["reset failed"], {
                        error,
                    });
                    throw error;
                }
            },
        ]);
        enhance(adapter, "trackFailure", [
            async ({ args: [key], next }) => {
                try {
                    await next();
                    logger.debug(["trackFailure succeeded"], {
                        group: "[CircuitBreaker]",
                        metadata: {
                            adapter: adapterName,
                            key,
                        },
                    });
                } catch (error: unknown) {
                    logger.error(["trackFailure failed"], {
                        error,
                    });
                    throw error;
                }
            },
        ]);
        enhance(adapter, "trackSuccess", [
            async ({ args: [key], next }) => {
                try {
                    await next();
                    logger.debug(["trackSuccess succeeded"], {
                        group: "[CircuitBreaker]",
                        metadata: {
                            adapter: adapterName,
                            key,
                        },
                    });
                } catch (error: unknown) {
                    logger.error(["trackSuccess failed"], {
                        error,
                    });
                    throw error;
                }
            },
        ]);
        enhance(adapter, "updateState", [
            async ({ args: [key], next }) => {
                try {
                    const transition = await next();
                    logger.debug(["updateState succeeded"], {
                        group: "[CircuitBreaker]",
                        metadata: {
                            adapter: adapterName,
                            key,
                            transition,
                        },
                    });
                    return transition;
                } catch (error: unknown) {
                    logger.error(["updateState failed"], {
                        error,
                    });
                    throw error;
                }
            },
        ]);
    };
}
