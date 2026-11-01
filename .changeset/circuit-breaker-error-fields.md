---
"eridu-tech": minor
---

Error instances in `eridu-tech/circuit-breaker/contracts` now expose the circuit `key` they were created for:

- `OpenCircuitBreakerError.key`
- `IsolatedCircuitBreakerError.key`
- `UnableToGetStateCircuitBreakerError.key`
- `UnableToUpdateStateCircuitBreakerError.key`
- `UnableToIsolateCircuitBreakerError.key`
- `UnableToTrackFailureCircuitBreakerError.key`
- `UnableToTrackSuccessCircuitBreakerError.key`
- `UnableToResetCircuitBreakerError.key`

Each `create()` factory passes the key to the error, so it is available as a `readonly` field alongside the existing `message` and `cause`.
