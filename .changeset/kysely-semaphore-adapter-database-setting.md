---
"eridu-tech": minor
---

`KyselySemaphoreAdapterSettings` takes a transaction-aware `database` instead of a `transactionContext`, and the adapter stores its slots as JSON.

- `new KyselySemaphoreAdapter({ database })` accepts either a `Kysely<KyselySemaphoreTables>` instance or an `ITransactionContext<Kysely<KyselySemaphoreTables>>`. A plain `Kysely` instance is wrapped in a no-op transaction context, so a single-database setup no longer has to build a `TransactionContext`. Passing a `TransactionContext` behaves as before: the adapter's operations join the context's active transaction.
- The `transactionContext` setting is gone. Rename it to `database` and pass either the context or its underlying `Kysely` instance.
- The `semaphoreSlot` table is gone. `init()` now creates a single `semaphore` table whose `slots` column stores the acquired slots as JSON, and the `KyselySemaphoreTables` type only has the `semaphore` key. Existing deployments must recreate the tables (or migrate their rows) before using the new schema.
- Every adapter operation is now a single SQL statement. `acquire`, `release` and `refresh` use one atomic `INSERT ... ON CONFLICT DO UPDATE`/`UPDATE ... RETURNING` that reads and writes the JSON slots in place, so no transaction or read-modify-write round trip is needed.
- `removeAllExpired` deletes the semaphores whose slots are all expired, so it no longer relies on an `expiration` column or index. Call it periodically (for example, using a cron job).
