/**
 * @module CircuitBreaker
 */

import type { CountBreakerSettings } from "@/circuit-breaker/contracts/_module-exports.js";

/**
 * @internal
 */
function validateFailureThreshold(failureThreshold: number): void {
    if (Number.isInteger(failureThreshold)) {
        throw new TypeError(
            `"CountBreakerSettings.failureThreshold" should be a float, got integer instead`,
        );
    }
    if (failureThreshold <= 0 || failureThreshold >= 1) {
        throw new RangeError(
            `"CountBreakerSettings.failureThreshold" should be between 0 and 1, got ${String(failureThreshold)}`,
        );
    }
}

/**
 * @internal
 */
function validateSuccessThreshold(successThreshold: number): void {
    if (Number.isInteger(successThreshold)) {
        throw new TypeError(
            `"CountBreakerSettings.successThreshold" should be a float, got integer instead`,
        );
    }
    if (successThreshold <= 0 || successThreshold >= 1) {
        throw new RangeError(
            `"CountBreakerSettings.successThreshold" should be between 0 and 1, got ${String(successThreshold)}`,
        );
    }
}

/**
 * @internal
 */
function validateSize(size: number): void {
    if (!Number.isSafeInteger(size)) {
        throw new TypeError(
            `"CountBreakerSettings.size" should be an integer, got float instead`,
        );
    }
    if (size < 1) {
        throw new RangeError(
            `"CountBreakerSettings.size" should be a positive, got ${String(size)}`,
        );
    }
}

/**
 * @internal
 */
function validateMinimumNumberOfCalls(
    minimumNumberOfCalls: number,
    size: number,
): void {
    if (!Number.isSafeInteger(minimumNumberOfCalls)) {
        throw new TypeError(
            `"CountBreakerSettings.minimumNumberOfCalls" should be an integer, got float instead`,
        );
    }
    if (minimumNumberOfCalls < 1 || minimumNumberOfCalls > size) {
        throw new RangeError(
            `"CountBreakerSettings.minimumNumberOfCalls" should be between 1, and "CountBreakerSettings.size" (which is ${String(size)}), got ${String(minimumNumberOfCalls)}`,
        );
    }
}

/**
 * @internal
 */
export function resolveCountBreakerSettings(
    settings: CountBreakerSettings,
): Required<CountBreakerSettings> {
    const {
        failureThreshold = 0.2,
        successThreshold = 1 - failureThreshold,
        size = 20,
        minimumNumberOfCalls = size,
    } = settings;

    validateFailureThreshold(failureThreshold);
    validateSuccessThreshold(successThreshold);
    validateSize(size);
    validateMinimumNumberOfCalls(minimumNumberOfCalls, size);

    return {
        failureThreshold,
        successThreshold,
        size,
        minimumNumberOfCalls,
    };
}
