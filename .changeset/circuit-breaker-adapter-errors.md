---
"eridu-tech": minor
---

New `UnableTo` errors that describe a circuit breaker adapter failure, available from `eridu-tech/circuit-breaker/contracts`:

- `UnableToGetStateCircuitBreakerError`
- `UnableToUpdateStateCircuitBreakerError`
- `UnableToIsolateCircuitBreakerError`
- `UnableToTrackFailureCircuitBreakerError`
- `UnableToTrackSuccessCircuitBreakerError`
- `UnableToResetCircuitBreakerError`

They are registered in `CIRCUIT_BREAKER_ERRORS`, so `isCircuitBreakerError()` and `AllCircuitBreakerErrors` include them. Each error wraps the unexpected adapter error as its `cause`, and `getState()`, `runOrFail()`, `isolate()` and `reset()` now document the `UnableTo` error they can throw when the underlying adapter fails, alongside `OpenCircuitBreakerError`.

The new `handleUnexpectedCircuitBreakerAdapterError` plugin applies that mapping to every adapter method. `CircuitBreakerFactory` wraps the provided adapter with it internally, so `try`/`catch` covers `getState`, `updateState`, `isolate`, `trackFailure`, `trackSuccess` and `reset` and rethrows the matching error with the original error as its cause. Circuit breakers created by the factory, including deserialized ones, therefore only reject with circuit breaker errors.
