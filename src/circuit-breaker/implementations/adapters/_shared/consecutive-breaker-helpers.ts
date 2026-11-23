/**
 * @module CircuitBreaker
 */

import type { ConsecutiveBreakerSettings } from "@/circuit-breaker/contracts/_module-exports.js";

/**
 * @internal
 */
function validateFailureThreshold(failureThreshold: number): void {
    if (!Number.isSafeInteger(failureThreshold)) {
        throw new TypeError(
            `"ConsecutiveBreakerSettings.failureThreshold" should be an integer, got float instead`,
        );
    }
    if (failureThreshold < 1) {
        throw new RangeError(
            `"ConsecutiveBreakerSettings.failureThreshold" should be a positive, got ${String(failureThreshold)}`,
        );
    }
}

/**
 * @internal
 */
function validateSuccessThreshold(successThreshold: number): void {
    if (!Number.isSafeInteger(successThreshold)) {
        throw new TypeError(
            `"ConsecutiveBreakerSettings.successThreshold" should be an integer, got float instead`,
        );
    }
    if (successThreshold < 1) {
        throw new RangeError(
            `"ConsecutiveBreakerSettings.successThreshold" should be a positive, got ${String(successThreshold)}`,
        );
    }
}

/**
 * @internal
 */
export function resolveConsecutiveBreakerSettings(
    settings: ConsecutiveBreakerSettings,
): Required<ConsecutiveBreakerSettings> {
    const { failureThreshold = 5, successThreshold = failureThreshold } =
        settings;
    validateFailureThreshold(failureThreshold);
    validateSuccessThreshold(successThreshold);
    return {
        failureThreshold,
        successThreshold,
    };
}
