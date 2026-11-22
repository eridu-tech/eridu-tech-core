---
"eridu-tech": minor
---

Remove the standalone rate limiter storage adapters and the `IRateLimiterStorageAdapter` contract.

- `IRateLimiterStorageAdapter` and `IRateLimiterStorageAdapterTransaction` are gone from `eridu-tech/rate-limiter/contracts`. The memory adapter keeps a private copy, so no public contract exposes the storage layer anymore.
- `DatabaseRateLimiterAdapter` and `DatabaseRateLimiterAdapterSettings` are removed. `MemoryRateLimiterAdapter` supersedes it and owns its policy and storage wiring, so there is no database-backed limiter to configure through a storage adapter.
- `MongodbRateLimiterStorageAdapter`, `PostgresRateLimiterStorageAdapter`, `KyselyRateLimiterStorageAdapter` (including its Postgres and SQLite backends), `NoOpRateLimiterStorageAdapter` and their settings types are removed. Use `MemoryRateLimiterAdapter`, `NoOpRateLimiterAdapter` or `RedisRateLimiterAdapter` directly; there is no storage-adapter plug-in point left.
- `MemoryRateLimiterStorageAdapter` is no longer public. It remains an internal detail of `MemoryRateLimiterAdapter`, and `eridu-tech/rate-limiter/memory-rate-limiter-adapter` only exports `MemoryRateLimiterAdapter`.
- The policy settings types (`FixedWindowLimiterSettings`, `SlidingWindowLimiterSettings`), their settings enums and the `LIMITER_POLICIES` constant now live in `eridu-tech/rate-limiter/contracts`; import them from there instead of the adapter helpers.
