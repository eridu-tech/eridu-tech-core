---
"eridu-tech": minor
---

Added the `MultiTransactionHooks` derivable, which fans `afterCommit()` hooks out to several transaction contexts.

- `new MultiTransactionHooks(transactionContexts)` implements `ITransactionHooks` over multiple `ITransactionContext` instances, so one consumer can stay transaction-aware across databases a project uses in separate, non-nested parts of its code, for example PostgreSQL in one part and MongoDB in another.

- When at least one wrapped context is inside a transaction, the hook is forwarded to all of them with `runIfNoTransaction: false`: it runs once per committing transaction and is discarded by the contexts that have no active transaction.

- When none of them is inside a transaction, the hook runs immediately unless `runIfNoTransaction: false` is passed, in which case it is discarded. The caller's setting only affects this decision, since the fan-out always forwards `runIfNoTransaction: false`.

- `MultiTransactionHooks` is exported from `eridu-tech/transaction-context`, next to `TransactionContext`, with tests covering all three behaviors above.

- Renamed `AfterCommitSettings.runWithoutTransaction` to `AfterCommitSettings.runIfNoTransaction`. The old name described the hook as running without a transaction, while the setting only decides what happens when there is no transaction. The behavior and its default (`true`) are unchanged. This affects `ITransactionHooks.afterCommit()` and the settings of `withAfterCommitFactory`.

    ### Breaking changes
    - The `runWithoutTransaction` option of `afterCommit()` and of the `withAfterCommitFactory` middleware was renamed to `runIfNoTransaction`.

    ### Migration

    **Before:**

    ```ts
    await transactionContext.afterCommit(hook, {
        runWithoutTransaction: false,
    });
    ```

    **After:**

    ```ts
    await transactionContext.afterCommit(hook, {
        runIfNoTransaction: false,
    });
    ```
