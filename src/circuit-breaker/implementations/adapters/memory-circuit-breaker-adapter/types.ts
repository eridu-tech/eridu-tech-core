/**
 * @module CircuitBreaker
 */
import type { AllCircuitBreakerState } from "@/circuit-breaker/contracts/_module-exports.js";
import type { InvocableFn } from "@/utilities/_module-exports.js";

/**
 * @internal
 */
export type CircuitBreakerUpdateStateFn<TMetrics = unknown> = InvocableFn<
    [currentState: AllCircuitBreakerState<TMetrics>, currentDate: Date],
    AllCircuitBreakerState<TMetrics>
>;
