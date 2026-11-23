---
"eridu-tech": minor
---

Consolidate the circuit breaker policy API in `eridu-tech/circuit-breaker/contracts` and remove the `eridu-tech/circuit-breaker/policies` module.

- `BREAKER_POLICIES`, `ConsecutiveBreakerSettings`, `CountBreakerSettings`, `SamplingBreakerSettings`, their `*SettingsEnum` variants and `CircuitBreakerPolicySettingsEnum` now live in `eridu-tech/circuit-breaker/contracts`. Import them from there instead of `eridu-tech/circuit-breaker/policies`.
- The public `ConsecutiveBreaker`, `CountBreaker` and `SamplingBreaker` policy classes, their `resolve*Settings` helpers, the `Serialized*` settings types, `ICircuitBreakerPolicy`, `CircuitBreakerTrackState`, `CircuitBreakerTrackSettings`, `CLOSED_TRANSITIONS`, `HALF_OPEN_TRANSITIONS`, `ClosedTransitions` and `HalfOpenTransitions` are no longer exported; the adapters apply the policy internally.
- Per-policy metrics and state types are exported from `eridu-tech/circuit-breaker/contracts` as `ConsecutiveBreakerMetrics`, `CountBreakerMetrics`, `Sample`, `SamplingBreakerMetrics`, `ClosedState`, `HalfOpenState`, `OpenState`, `IsolatedState` and `AllCircuitBreakerState`. `CircuitBreakerClosedState` and `CircuitBreakerHalfOpenState` are renamed to `ClosedState` and `HalfOpenState`.
- `ConsecutiveBreakerStateEnum`, `CountBreakerStateEnum`, `SamplingBreakerStateEnum` and `CircuitBreakerStateEnum` describe the stored policy state and are exported from `eridu-tech/circuit-breaker/contracts`.
