---
"eridu-tech": minor
---

Added the `withAfterCommitFactory` middleware, which defers the wrapped function until the active transaction commits.

- `withAfterCommitFactory(transactionContext)` takes an `ITransactionHooks` implementation, such as a `TransactionContext`, and returns a middleware factory. The optional `settings` argument of type `AfterCommitSettings` is forwarded to `ITransactionHooks.afterCommit()`, so `runIfNoTransaction` decides what happens when no transaction is active: the wrapped function runs immediately (the default) or is discarded.
    - The middleware resolves to `Promise<void>`, so the wrapped function's return value is not propagated to the caller.

- The middleware is exported from `eridu-tech/transaction-context/middlewares`, next to `withTransactionFactory`. Added tests covering the `afterCommit` call and the forwarded settings.
