---
"eridu-tech": minor
---

Remove the standalone circuit breaker storage adapters and the `ICircuitBreakerStorageAdapter` contract.

- `ICircuitBreakerStorageAdapter` is gone from `eridu-tech/circuit-breaker/contracts`, and `circuitBreakerStorageAdapterTestSuite` is gone from `eridu-tech/circuit-breaker/test-utilities`. No public contract exposes the storage layer anymore.
- `DatabaseCircuitBreakerAdapter` and `DatabaseCircuitBreakerAdapterSettings` are removed, together with the `eridu-tech/circuit-breaker/database-circuit-breaker-adapter` subpath. Use `MemoryCircuitBreakerAdapter`, `MongodbCircuitBreakerAdapter` or `KyselyCircuitBreakerAdapter` instead.
- `MongodbCircuitBreakerStorageAdapter`, `KyselyCircuitBreakerStorageAdapter` (including its Postgres and SQLite backends), `MemoryCircuitBreakerStorageAdapter` and `NoOpCircuitBreakerStorageAdapter` and their settings types are removed, together with their package subpaths. There is no storage-adapter plug-in point left; every adapter owns its own persistence.
