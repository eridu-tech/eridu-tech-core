/**
 * @module CircuitBreaker
 */

import {
    CLOSED_TRANSITIONS,
    HALF_OPEN_TRANSITIONS,
    resolveCountBreakerSettings,
} from "@/circuit-breaker/implementations/adapters/_shared/_module.js";

import type {
    CountBreakerMetrics,
    CountBreakerSettings,
} from "@/circuit-breaker/contracts/_module-exports.js";
import type {
    CircuitBreakerTrackSettings,
    CircuitBreakerTrackState,
    ClosedTransitions,
    HalfOpenTransitions,
    ICircuitBreakerPolicy,
} from "@/circuit-breaker/implementations/adapters/_shared/_module.js";

/**
 * The `CountBreaker` breaks after a proportion of requests in a count based sliding window fail.
 *
 * @internal
 */
export class CountBreaker implements ICircuitBreakerPolicy<CountBreakerMetrics> {
    private readonly failureThreshold: number;
    private readonly successThreshold: number;
    private readonly minimumNumberOfCalls: number;
    private readonly size: number;

    constructor(settings: CountBreakerSettings = {}) {
        const {
            failureThreshold,
            successThreshold,
            size,
            minimumNumberOfCalls,
        } = resolveCountBreakerSettings(settings);

        this.failureThreshold = failureThreshold;
        this.successThreshold = successThreshold;
        this.minimumNumberOfCalls = minimumNumberOfCalls;
        this.size = size;
    }

    initialMetrics(): CountBreakerMetrics {
        return {
            samples: [],
        };
    }

    private static failureCount(currentMetrics: CountBreakerMetrics): number {
        let count = 0;
        for (const isSuccess of currentMetrics.samples) {
            if (!isSuccess) {
                count++;
            }
        }
        return count;
    }

    private static successCount(currentMetrics: CountBreakerMetrics): number {
        let count = 0;
        for (const isSuccess of currentMetrics.samples) {
            if (isSuccess) {
                count++;
            }
        }
        return count;
    }

    private isMinimumNotMet(currentMetrics: CountBreakerMetrics): boolean {
        return currentMetrics.samples.length <= this.minimumNumberOfCalls;
    }

    whenClosed(
        currentMetrics: CountBreakerMetrics,
        _currentDate: Date,
    ): ClosedTransitions {
        if (this.isMinimumNotMet(currentMetrics)) {
            return CLOSED_TRANSITIONS.NONE;
        }

        const allowedFailureCount = Math.ceil(
            this.failureThreshold * currentMetrics.samples.length,
        );

        const hasFailed =
            CountBreaker.failureCount(currentMetrics) > allowedFailureCount;
        if (hasFailed) {
            return CLOSED_TRANSITIONS.TO_OPEN;
        }

        return CLOSED_TRANSITIONS.NONE;
    }

    whenHalfOpened(
        currentMetrics: CountBreakerMetrics,
        _currentDate: Date,
    ): HalfOpenTransitions {
        if (this.isMinimumNotMet(currentMetrics)) {
            return CLOSED_TRANSITIONS.NONE;
        }

        const allowedSuccessCount = Math.ceil(
            this.successThreshold * currentMetrics.samples.length,
        );
        const hasSucceeded =
            CountBreaker.successCount(currentMetrics) >= allowedSuccessCount;
        if (hasSucceeded) {
            return HALF_OPEN_TRANSITIONS.TO_CLOSED;
        }
        return HALF_OPEN_TRANSITIONS.TO_OPEN;
    }

    private track(
        success: boolean,
        currentState: CircuitBreakerTrackState<CountBreakerMetrics>,
    ): CountBreakerMetrics {
        let newSamples = [...currentState.metrics.samples, success];
        if (currentState.metrics.samples.length >= this.size) {
            newSamples = newSamples.slice(1);
        }
        return {
            samples: newSamples,
        };
    }

    trackFailure(
        currentState: CircuitBreakerTrackState<CountBreakerMetrics>,
        _settings: CircuitBreakerTrackSettings<CountBreakerMetrics>,
    ): CountBreakerMetrics {
        return this.track(false, currentState);
    }

    trackSuccess(
        currentState: CircuitBreakerTrackState<CountBreakerMetrics>,
        _settings: CircuitBreakerTrackSettings<CountBreakerMetrics>,
    ): CountBreakerMetrics {
        return this.track(true, currentState);
    }

    isEqual(
        metricsA: CountBreakerMetrics,
        metricsB: CountBreakerMetrics,
    ): boolean {
        const failureCountA = metricsA.samples.filter(
            (isSuccess) => !isSuccess,
        ).length;
        const failureCountB = metricsB.samples.filter(
            (isSuccess) => !isSuccess,
        ).length;
        const successCountA = metricsA.samples.filter(
            (isSuccess) => isSuccess,
        ).length;
        const successCountB = metricsB.samples.filter(
            (isSuccess) => isSuccess,
        ).length;
        return (
            failureCountA === failureCountB && successCountA === successCountB
        );
    }
}
