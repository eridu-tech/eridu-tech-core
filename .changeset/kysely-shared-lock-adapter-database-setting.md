---
"eridu-tech": minor
---

`KyselySharedLockAdapterSettings` takes a transaction-aware `database` instead of a `transactionContext`, and the adapter stores the whole shared-lock state in a single table.

- `new KyselySharedLockAdapter({ database })` accepts either a `Kysely<KyselySharedLockTables>` instance or an `ITransactionContext<Kysely<KyselySharedLockTables>>`. A plain `Kysely` instance is wrapped in a no-op transaction context, so a single-database setup no longer has to build a `TransactionContext`.
- The `transactionContext` setting is gone. Rename it to `database` and pass either the context or its underlying `Kysely` instance.
- The `writerLock` and `readerSemaphore` tables are gone. `init()` now creates a single `sharedLock` table with four columns: `key`, a JSON `writerLock` column (`{ owner, expiration }` or null), a JSON `readerSemaphore` column (`{ limit, slots }` or null) and an `expiration` column (`double precision` on postgres, `real` on sqlite, or null). `KyselySharedLockTables` only has the `sharedLock` key, and `KyselyWriterLockTable`, `KyselyReaderSemaphoreTable` and `KyselyReaderSemaphoreSlotTable` are replaced by `KyselyWriterLockEntry`, `KyselyReaderSemaphoreEntry` and `KyselyReaderSemaphoreSlotEntry`. Existing deployments must recreate the tables (or migrate their rows) before using the new schema.
- Every adapter operation is now a single SQL statement that reads and writes both JSON columns in place, so writer and reader acquisitions serialize on the same row and no transaction or read-modify-write round trip is needed.
- The `expiration` column mirrors the MongoDB adapter's `expiration` field. It holds the writer expiration while a writer holds the lock, the latest unexpired reader slot expiration while readers hold it, a past timestamp when no slot is held anymore and `null` when the state never expires. Releasing a writer or forcing a release deletes the row.
- `removeAllExpired` deletes the rows whose `expiration` is in the past, so it relies on the `sharedLock_expiration` index instead of inspecting the JSON columns. Call it periodically (for example, using a cron job).
