/**
 * @module CircuitBreaker
 */

import { TO_MILLISECONDS } from "@/time-span/contracts/_module-exports.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";

import type { SamplingBreakerSettings } from "@/circuit-breaker/contracts/_module-exports.js";

/**
 * @internal
 */
function validateFailureThreshold(failureThreshold: number): void {
    if (Number.isInteger(failureThreshold)) {
        throw new TypeError(
            `"SamplingBreakerSettings.failureThreshold" should be a float, got integer instead`,
        );
    }
    if (failureThreshold <= 0 || failureThreshold >= 1) {
        throw new RangeError(
            `"SamplingBreakerSettings.failureThreshold" should be between 0 and 1, got ${String(failureThreshold)}`,
        );
    }
}

/**
 * @internal
 */
function validateSuccessThreshold(successThreshold: number): void {
    if (Number.isInteger(successThreshold)) {
        throw new TypeError(
            `"SamplingBreakerSettings.successThreshold" should be a float, got integer instead`,
        );
    }
    if (successThreshold <= 0 || successThreshold >= 1) {
        throw new RangeError(
            `"SamplingBreakerSettings.successThreshold" should be between 0 and 1, got ${String(successThreshold)}`,
        );
    }
}

/**
 * @internal
 */
export function resolveSamplingBreakerSettings(
    settings: SamplingBreakerSettings,
): Required<SamplingBreakerSettings> {
    const {
        failureThreshold = 0.2,
        successThreshold = 1 - failureThreshold,
        timeSpan = TimeSpan.fromMinutes(1),
        sampleTimeSpan = TimeSpan.fromTimeSpan(timeSpan).divide(6),
        minimumRps = 10,
    } = settings;

    validateFailureThreshold(failureThreshold);
    validateSuccessThreshold(successThreshold);

    return {
        failureThreshold,
        successThreshold,
        timeSpan,
        sampleTimeSpan,
        minimumRps,
    };
}

/**
 * @internal
 */
export type SerializedSamplingBreakerSettings = {
    failureThreshold?: number;
    successThreshold?: number;
    timeSpan?: number;
    sampleTimeSpan?: number;
    minimumRps?: number;
};

/**
 * @internal
 */
export function serializeSamplingBreakerSettings(
    settings: SamplingBreakerSettings,
): Required<SerializedSamplingBreakerSettings> {
    const {
        failureThreshold,
        successThreshold,
        timeSpan,
        sampleTimeSpan,
        minimumRps,
    } = resolveSamplingBreakerSettings(settings);
    return {
        failureThreshold,
        successThreshold,
        timeSpan: timeSpan[TO_MILLISECONDS](),
        sampleTimeSpan: sampleTimeSpan[TO_MILLISECONDS](),
        minimumRps,
    };
}
