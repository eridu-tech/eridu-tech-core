---
"eridu-tech": minor
---

Add the Kysely rate limiter adapter at `eridu-tech/rate-limiter/kysely-rate-limiter-adapter` for SQLite and Postgres.

- `KyselyRateLimiterAdapter` stores the fixed-window or sliding-window state in one `rateLimiter` table whose `data` column is JSON (`jsonb` on Postgres, `json` on SQLite). `KyselyRateLimiterAdapterSettings` takes a transaction-aware `database` plus the optional `backoffPolicy` and `rateLimiterPolicy`.
- `KyselyRateLimiterTables` and `KyselyRateLimiterEntryTable` are exported so the database can be typed with `new Kysely<KyselyRateLimiterTables>()`.
- The adapter implements `IAsyncInitizable`, `IAsyncDeinitizable` and `IAsyncPrunable`: call `init()` once to create the table and its expiration index, `deInit()` to drop them, and `removeAllExpired()` to delete expired entries.
- The adapter is transaction aware: it reads and writes through the ambient transaction of the given `database` and never starts a transaction of its own.
