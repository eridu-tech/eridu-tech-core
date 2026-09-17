---
"eridu-tech": minor
---

Added the `MultiTransactionHooks` derivable, which fans `afterCommit()` hooks out to several transaction contexts.

- `new MultiTransactionHooks(transactionContexts)` implements `ITransactionHooks` over multiple `ITransactionContext` instances, so one consumer can stay transaction-aware across databases a project uses in separate, non-nested parts of its code, for example PostgreSQL in one part and MongoDB in another.

- When at least one wrapped context is inside a transaction, the hook is forwarded to all of them with `runWithoutTransaction: false`: it runs once per committing transaction and is discarded by the contexts that have no active transaction.

- When none of them is inside a transaction, the hook runs immediately unless `runWithoutTransaction: false` is passed, in which case it is discarded. The caller's setting only affects this decision, since the fan-out always forwards `runWithoutTransaction: false`.

- `MultiTransactionHooks` is exported from `eridu-tech/transaction-context`, next to `TransactionContext`, with tests covering all three behaviors above.
