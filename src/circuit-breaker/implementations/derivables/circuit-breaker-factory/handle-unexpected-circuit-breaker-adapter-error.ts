/**
 * @module CircuitBreaker
 */

import {
    UnableToGetStateCircuitBreakerError,
    UnableToIsolateCircuitBreakerError,
    UnableToResetCircuitBreakerError,
    UnableToTrackFailureCircuitBreakerError,
    UnableToTrackSuccessCircuitBreakerError,
    UnableToUpdateStateCircuitBreakerError,
} from "@/circuit-breaker/contracts/_module-exports.js";

import type { ICircuitBreakerAdapter } from "@/circuit-breaker/contracts/_module-exports.js";
import type { PluginFn } from "@/middleware/contracts/_module-exports.js";

/**
 * Creates a plugin that converts unexpected errors thrown by a circuit breaker adapter into `UnableTo*CircuitBreakerError` errors.
 *
 * Every method of the wrapped `ICircuitBreakerAdapter` is wrapped in a `try`/`catch` block,
 * and the original error is preserved as the `cause` of the matching error:
 * - `getState` throws {@link UnableToGetStateCircuitBreakerError | `UnableToGetStateCircuitBreakerError`}
 * - `updateState` throws {@link UnableToUpdateStateCircuitBreakerError | `UnableToUpdateStateCircuitBreakerError`}
 * - `isolate` throws {@link UnableToIsolateCircuitBreakerError | `UnableToIsolateCircuitBreakerError`}
 * - `trackFailure` throws {@link UnableToTrackFailureCircuitBreakerError | `UnableToTrackFailureCircuitBreakerError`}
 * - `trackSuccess` throws {@link UnableToTrackSuccessCircuitBreakerError | `UnableToTrackSuccessCircuitBreakerError`}
 * - `reset` throws {@link UnableToResetCircuitBreakerError | `UnableToResetCircuitBreakerError`}
 *
 * @returns A middleware plugin that wraps an `ICircuitBreakerAdapter`.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker"`
 * @group Derivables
 * @internal
 */
export function handleUnexpectedCircuitBreakerAdapterError(): PluginFn<ICircuitBreakerAdapter> {
    return (adapter, enhance) => {
        enhance(adapter, "getState", async ({ args: [key], next }) => {
            try {
                return await next();
            } catch (cause) {
                throw UnableToGetStateCircuitBreakerError.create(key, cause);
            }
        });
        enhance(adapter, "updateState", async ({ args: [key], next }) => {
            try {
                return await next();
            } catch (cause) {
                throw UnableToUpdateStateCircuitBreakerError.create(key, cause);
            }
        });
        enhance(adapter, "isolate", async ({ args: [key], next }) => {
            try {
                await next();
                return;
            } catch (cause) {
                throw UnableToIsolateCircuitBreakerError.create(key, cause);
            }
        });
        enhance(adapter, "trackFailure", async ({ args: [key], next }) => {
            try {
                await next();
                return;
            } catch (cause) {
                throw UnableToTrackFailureCircuitBreakerError.create(
                    key,
                    cause,
                );
            }
        });
        enhance(adapter, "trackSuccess", async ({ args: [key], next }) => {
            try {
                await next();
                return;
            } catch (cause) {
                throw UnableToTrackSuccessCircuitBreakerError.create(
                    key,
                    cause,
                );
            }
        });
        enhance(adapter, "reset", async ({ args: [key], next }) => {
            try {
                await next();
                return;
            } catch (cause) {
                throw UnableToResetCircuitBreakerError.create(key, cause);
            }
        });
    };
}
