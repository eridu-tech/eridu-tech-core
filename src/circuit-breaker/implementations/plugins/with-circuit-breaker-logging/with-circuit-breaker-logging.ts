/**
 * @module CircuitBreaker
 */

import type { ICircuitBreakerAdapter } from "@/circuit-breaker/contracts/_module-exports.js";
import type { ILog } from "@/log/contracts/_module-exports.js";
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
 * @param log - The log that receives the entries. Only `debug`, `error` and `putMetadata` are used.
 * @returns A middleware plugin that wraps an `ICircuitBreakerAdapter`.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/plugins"`
 * @group Plugins
 */
export function withCircuitBreakerLogging(
    log: Pick<ILog, "debug" | "error">,
): PluginFn<ICircuitBreakerAdapter> {
    return (adapter, enhance, adapterName) => {
        enhance(adapter, "getState", [
            async ({ args: [key], next }) => {
                try {
                    const state = await next();
                    log.debug(["getState succeeded"], {
                        group: "[CircuitBreaker]",
                        metadata: {
                            adapter: adapterName,
                            key,
                            state,
                        },
                    });
                    return state;
                } catch (error: unknown) {
                    log.error(["getState failed"], {
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
                    log.debug(["isolate succeeded"], {
                        group: "[CircuitBreaker]",
                        metadata: {
                            adapter: adapterName,
                            key,
                        },
                    });
                } catch (error: unknown) {
                    log.error(["isolate failed"], {
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
                    log.debug(["reset succeeded"], {
                        group: "[CircuitBreaker]",
                        metadata: {
                            adapter: adapterName,
                            key,
                        },
                    });
                } catch (error: unknown) {
                    log.error(["reset failed"], {
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
                    log.debug(["trackFailure succeeded"], {
                        group: "[CircuitBreaker]",
                        metadata: {
                            adapter: adapterName,
                            key,
                        },
                    });
                } catch (error: unknown) {
                    log.error(["trackFailure failed"], {
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
                    log.debug(["trackSuccess succeeded"], {
                        group: "[CircuitBreaker]",
                        metadata: {
                            adapter: adapterName,
                            key,
                        },
                    });
                } catch (error: unknown) {
                    log.error(["trackSuccess failed"], {
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
                    log.debug(["updateState succeeded"], {
                        group: "[CircuitBreaker]",
                        metadata: {
                            adapter: adapterName,
                            key,
                            transition,
                        },
                    });
                    return transition;
                } catch (error: unknown) {
                    log.error(["updateState failed"], {
                        error,
                    });
                    throw error;
                }
            },
        ]);
    };
}
