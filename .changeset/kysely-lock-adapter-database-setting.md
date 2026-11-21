---
"eridu-tech": minor
---

`KyselyLockAdapterSettings` takes a transaction-aware `database` instead of a `transactionContext`.

- `new KyselyLockAdapter({ database })` accepts either a `Kysely<KyselyLockTables>` instance or an `ITransactionContext<Kysely<KyselyLockTables>>`. A plain `Kysely` instance is wrapped in a no-op transaction context, so a single-database setup no longer has to build a `TransactionContext`. Passing a `TransactionContext` behaves as before: the adapter's operations join the context's active transaction.
- The `transactionContext` setting is gone. Rename it to `database` and pass either the context or its underlying `Kysely` instance.
