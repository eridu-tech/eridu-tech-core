---
"eridu-tech": minor
---

Integrated the `transaction-context` component with all MongoDB-backed adapters, so their operations join the active transaction instead of always running against the base client.

- The `database` setting of `MongodbCacheAdapter`, `MongodbLockAdapter`, `MongodbSemaphoreAdapter` and `MongodbSharedLockAdapter` is now typed `TransactionAware<Db, ClientSession>` instead of `Db`, and is resolved with `resolveTransactionAware`. Passing a plain `Db` keeps the previous behavior because it is wrapped in a no-op transaction context, while passing a `TransactionContext` makes the adapter participate in the ambient transaction.

- Every read and write now passes `session: this.trxCtx.transaction ?? undefined` to the underlying collection call, so the operation runs inside the transaction when one is active. The collection is still created from `trxCtx.client`.
    - `init()` and `deInit()` are intentionally kept outside of the transaction, because `createIndex`, `dropIndexes` and `drop` are not allowed inside a MongoDB transaction.

- `MongodbCircuitBreakerStorageAdapter` and `MongodbRateLimiterStorageAdapter` now require `transactionContext: ITransactionContext<Db, ClientSession>`, replacing the previous `database: Db` and `client: MongoClient` settings, because their operations rely on transactions to stay correct. A plain `Db` is no longer accepted, so unlike the adapters above there is no silent no-op fallback and no `database` setting to resolve. Their `transaction(fn)` method runs the callback through the provided transaction context with `REQUIRED` propagation.

- Removed the optional `session?: ClientSession` parameter from `MongodbCircuitBreakerStorageAdapter.find`/`remove` and `MongodbRateLimiterStorageAdapter.upsert`/`find`/`remove`, since the session is now always derived from the active transaction.

- Added transaction integration tests to all MongoDB adapters and updated their expiration tests.
