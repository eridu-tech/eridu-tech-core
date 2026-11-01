/**
 * @module CircuitBreaker
 */
import {
    isCircuitBreakerError,
    IsolatedCircuitBreakerError,
    isUnableToCircuitBreakerError,
    OpenCircuitBreakerError,
} from "@/circuit-breaker/contracts/_module-exports.js";
import { HttpError } from "@/http-router/contracts/_module-exports.js";
import { UnexpectedError } from "@/utilities/_module-exports.js";

import type { AllCircuitBreakerErrors } from "@/circuit-breaker/contracts/_module-exports.js";
import type { HttpMiddlewareFn } from "@/http-router/contracts/_module-exports.js";

/**
 * @internal
 */
function toHttpError(circuitBreakerError: AllCircuitBreakerErrors): HttpError {
    if (circuitBreakerError instanceof OpenCircuitBreakerError) {
        return HttpError.create({
            status: "503",
            message: "Circuit breaker is open",
            cause: circuitBreakerError,
        });
    }
    if (circuitBreakerError instanceof IsolatedCircuitBreakerError) {
        return HttpError.create({
            status: "503",
            message: "Circuit breaker is isolated",
            cause: circuitBreakerError,
        });
    }
    if (isUnableToCircuitBreakerError(circuitBreakerError)) {
        return HttpError.create({
            status: "503",
            message: "Circuit breaker adapter failed",
            cause: circuitBreakerError,
        });
    }

    throw UnexpectedError.create("!!__MESSAGE__!!");
}

/**
 * Creates an HTTP middleware that converts every circuit breaker error thrown
 * by the wrapped handler or middleware into an {@link HttpError}.
 *
 * The original error is preserved as the `cause` of the `HttpError`. Errors
 * that are not circuit breaker errors are rethrown untouched.
 *
 * @returns The HTTP middleware.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/middlewares"`
 * @group Middlewares
 */
export function withHttpCircuitBreakerError(): HttpMiddlewareFn {
    return async (args) => {
        try {
            return await args.next();
        } catch (error: unknown) {
            if (isCircuitBreakerError(error)) {
                throw toHttpError(error);
            }
            throw error;
        }
    };
}
