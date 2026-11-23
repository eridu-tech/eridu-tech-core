---
"eridu-tech": minor
---

Remove the standalone rate limiter storage adapters and the `IRateLimiterStorageAdapter` contract.

- `IRateLimiterStorageAdapter` and `IRateLimiterStorageAdapterTransaction` are gone from `eridu-tech/rate-limiter/contracts`, and `rateLimiterStorageAdapterTestSuite` is gone from `eridu-tech/rate-limiter/test-utilities`. No public contract exposes the storage layer anymore.
- `DatabaseRateLimiterAdapter` and `DatabaseRateLimiterAdapterSettings` are removed, together with the `eridu-tech/rate-limiter/database-rate-limiter-adapter` subpath. Use `MemoryRateLimiterAdapter`, `MongdobRateLimiter` or `KyselyRateLimiterAdapter` instead.
- `MongodbRateLimiterStorageAdapter`, `KyselyRateLimiterStorageAdapter` (including its Postgres and SQLite backends), `MemoryRateLimiterStorageAdapter` and `NoOpRateLimiterStorageAdapter` and their settings types are removed, together with their package subpaths. There is no storage-adapter plug-in point left; every adapter owns its own persistence.
- `IRateLimiterData` is no longer exported from `eridu-tech/rate-limiter/contracts`.
