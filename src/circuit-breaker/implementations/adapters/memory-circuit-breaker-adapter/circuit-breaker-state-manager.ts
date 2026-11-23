/**
 * @module CircuitBreaker
 */

import { CIRCUIT_BREAKER_STATE } from "@/circuit-breaker/contracts/_module-exports.js";

import type { BackoffPolicy } from "@/backoff-policies/contracts/_module.js";
import type { InternalCircuitBreakerPolicy } from "@/circuit-breaker/implementations/adapters/memory-circuit-breaker-adapter/internal-circuit-breaker-policy.js";
import type { CircuitBreakerUpdateStateFn } from "@/circuit-breaker/implementations/adapters/memory-circuit-breaker-adapter/types.js";

/**
 * @internal
 */
export class CircuitBreakerStateManager<TMetrics = unknown> {
    constructor(
        private readonly circuitBreakerPolicy: InternalCircuitBreakerPolicy<TMetrics>,
        private readonly backoffPolicy: BackoffPolicy,
    ) {}

    updateState: CircuitBreakerUpdateStateFn<TMetrics> = (
        currentState,
        currentDate,
    ) => {
        if (currentState.type === CIRCUIT_BREAKER_STATE.CLOSED) {
            return this.circuitBreakerPolicy.whenClosed(
                currentState,
                currentDate,
            );
        }

        if (currentState.type === CIRCUIT_BREAKER_STATE.OPEN) {
            return this.circuitBreakerPolicy.whenOpened(currentState, {
                currentDate,
                backoffPolicy: this.backoffPolicy,
            });
        }

        if (currentState.type === CIRCUIT_BREAKER_STATE.ISOLATED) {
            return currentState;
        }

        return this.circuitBreakerPolicy.whenHalfOpened(
            currentState,
            currentDate,
        );
    };

    trackFailure: CircuitBreakerUpdateStateFn<TMetrics> = (
        currentState,
        currentDate,
    ) => {
        if (currentState.type === CIRCUIT_BREAKER_STATE.CLOSED) {
            return this.circuitBreakerPolicy.trackFailureWhenClosed(
                currentState,
                currentDate,
            );
        }

        if (currentState.type === CIRCUIT_BREAKER_STATE.HALF_OPEN) {
            return this.circuitBreakerPolicy.trackFailureWhenHalfOpened(
                currentState,
                currentDate,
            );
        }

        return currentState;
    };

    trackSuccess: CircuitBreakerUpdateStateFn<TMetrics> = (
        currentState,
        currentDate,
    ) => {
        if (currentState.type === CIRCUIT_BREAKER_STATE.CLOSED) {
            return this.circuitBreakerPolicy.trackSuccessWhenClosed(
                currentState,
                currentDate,
            );
        }

        if (currentState.type === CIRCUIT_BREAKER_STATE.HALF_OPEN) {
            return this.circuitBreakerPolicy.trackSuccessWhenHalfOpened(
                currentState,
                currentDate,
            );
        }

        return currentState;
    };

    isolate: CircuitBreakerUpdateStateFn<TMetrics> = (
        _currentState,
        _currentDate,
    ) => {
        return {
            type: CIRCUIT_BREAKER_STATE.ISOLATED,
        };
    };
}
