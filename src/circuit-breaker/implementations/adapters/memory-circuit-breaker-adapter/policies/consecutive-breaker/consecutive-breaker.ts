/**
 * @module CircuitBreaker
 */

import { CIRCUIT_BREAKER_STATE } from "@/circuit-breaker/contracts/_module-exports.js";
import {
    CLOSED_TRANSITIONS,
    HALF_OPEN_TRANSITIONS,
    resolveConsecutiveBreakerSettings,
} from "@/circuit-breaker/implementations/adapters/_shared/_module.js";

import type {
    ConsecutiveBreakerMetrics,
    ConsecutiveBreakerSettings,
} from "@/circuit-breaker/contracts/_module-exports.js";
import type {
    CircuitBreakerTrackSettings,
    CircuitBreakerTrackState,
    ClosedTransitions,
    HalfOpenTransitions,
    ICircuitBreakerPolicy,
} from "@/circuit-breaker/implementations/adapters/_shared/_module.js";

/**
 * The `ConsecutiveBreaker` breaks after n requests in a row fail.
 *
 * @internal
 */
export class ConsecutiveBreaker implements ICircuitBreakerPolicy<ConsecutiveBreakerMetrics> {
    private readonly failureThreshold: number;
    private readonly successThreshold: number;

    constructor(settings: ConsecutiveBreakerSettings = {}) {
        const { failureThreshold, successThreshold } =
            resolveConsecutiveBreakerSettings(settings);
        this.failureThreshold = failureThreshold;
        this.successThreshold = successThreshold;
    }

    initialMetrics(): ConsecutiveBreakerMetrics {
        return {
            failureCount: 0,
            successCount: 0,
        };
    }

    whenClosed(
        currentMetrics: ConsecutiveBreakerMetrics,
        _currentDate: Date,
    ): ClosedTransitions {
        const hasFailed = currentMetrics.failureCount >= this.failureThreshold;
        if (hasFailed) {
            return CLOSED_TRANSITIONS.TO_OPEN;
        }
        return CLOSED_TRANSITIONS.NONE;
    }

    whenHalfOpened(
        currentMetrics: ConsecutiveBreakerMetrics,
        _currentDate: Date,
    ): HalfOpenTransitions {
        const hasFailed = currentMetrics.failureCount > 0;
        if (hasFailed) {
            return HALF_OPEN_TRANSITIONS.TO_OPEN;
        }
        const hasSucceeded =
            currentMetrics.successCount >= this.successThreshold;
        if (hasSucceeded) {
            return HALF_OPEN_TRANSITIONS.TO_CLOSED;
        }
        return HALF_OPEN_TRANSITIONS.NONE;
    }

    trackFailure(
        currentState: CircuitBreakerTrackState<ConsecutiveBreakerMetrics>,
        _settings: CircuitBreakerTrackSettings<ConsecutiveBreakerMetrics>,
    ): ConsecutiveBreakerMetrics {
        return {
            failureCount: currentState.metrics.failureCount + 1,
            successCount: currentState.metrics.successCount,
        };
    }

    trackSuccess(
        currentState: CircuitBreakerTrackState<ConsecutiveBreakerMetrics>,
        settings: CircuitBreakerTrackSettings<ConsecutiveBreakerMetrics>,
    ): ConsecutiveBreakerMetrics {
        if (currentState.type === CIRCUIT_BREAKER_STATE.CLOSED) {
            return settings.initialMetrics;
        }

        return {
            failureCount: currentState.metrics.failureCount,
            successCount: currentState.metrics.successCount + 1,
        };
    }

    isEqual(
        metricsA: ConsecutiveBreakerMetrics,
        metricsB: ConsecutiveBreakerMetrics,
    ): boolean {
        return (
            metricsA.failureCount === metricsB.failureCount &&
            metricsA.successCount === metricsB.successCount
        );
    }
}
