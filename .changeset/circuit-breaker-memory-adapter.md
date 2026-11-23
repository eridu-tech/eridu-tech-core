---
"eridu-tech": minor
---

Add `MemoryCircuitBreakerAdapter` at `eridu-tech/circuit-breaker/memory-circuit-breaker-adapter`.

- `MemoryCircuitBreakerAdapter` owns its storage and applies the configured `CONSECUTIVE`, `COUNT` or `SAMPLING` policy. `MemoryCircuitBreakerAdapterSettings` only takes `backoffPolicy` and `circuitBreakerPolicy`, so no storage wiring is needed.
- The adapter implements `IDeinitizable` (`deInit()`, which is synchronous).
- State is process-local, so it is shared neither between processes nor across restarts.
