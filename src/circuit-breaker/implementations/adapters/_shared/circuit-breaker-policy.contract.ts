/**
 * @module CircuitBreaker
 */

import type {
    CIRCUIT_BREAKER_STATE,
    ClosedState,
} from "@/circuit-breaker/contracts/_module-exports.js";

/**
 * Enumerated state transitions when the circuit breaker is in CLOSED state.
 *
 * @internal
 */
export const CLOSED_TRANSITIONS = {
    TO_OPEN: "TO_OPEN",
    NONE: "NONE",
} as const;

/**
 * @internal
 */
export type ClosedTransitions =
    (typeof CLOSED_TRANSITIONS)[keyof typeof CLOSED_TRANSITIONS];

/**
 * Enumerated state transitions when the circuit breaker is in HALF_OPEN state.
 *
 * @internal
 */
export const HALF_OPEN_TRANSITIONS = {
    TO_OPEN: "TO_OPEN",
    TO_CLOSED: "TO_CLOSED",
    NONE: "NONE",
} as const;

/**
 * @internal
 */
export type HalfOpenTransitions =
    (typeof HALF_OPEN_TRANSITIONS)[keyof typeof HALF_OPEN_TRANSITIONS];

/**
 * States in which metrics are actively accumulated.
 *
 * @internal
 */
export type CircuitBreakerTrackState<TMetrics = unknown> =
    | ClosedState<TMetrics>
    | {
          type: typeof CIRCUIT_BREAKER_STATE.HALF_OPEN;
          metrics: TMetrics;
      };

/**
 * @internal
 */
export type CircuitBreakerTrackSettings<TMetrics = unknown> = {
    currentDate: Date;
    initialMetrics: TMetrics;
};

/**
 * Policy contract defining the circuit breaker algorithm and metrics tracking.
 * All methods must be pure functions and must not mutate their inputs.
 *
 * @internal
 */
export type ICircuitBreakerPolicy<TMetrics = unknown> = {
    initialMetrics(): TMetrics;

    whenClosed(currentMetrics: TMetrics, currentDate: Date): ClosedTransitions;

    whenHalfOpened(
        currentMetrics: TMetrics,
        currentDate: Date,
    ): HalfOpenTransitions;

    trackFailure(
        currentState: CircuitBreakerTrackState<TMetrics>,
        settings: CircuitBreakerTrackSettings<TMetrics>,
    ): TMetrics;

    trackSuccess(
        currentState: CircuitBreakerTrackState<TMetrics>,
        settings: CircuitBreakerTrackSettings<TMetrics>,
    ): TMetrics;

    isEqual?(metricsA: TMetrics, metricsB: TMetrics): boolean;
};
