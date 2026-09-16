---
"eridu-tech": minor
---

Integrated the `transaction-context` component with every Kysely-backed adapter, so their operations join the active transaction instead of always starting their own.

- The `kysely` setting of every Kysely-backed adapter is replaced by a `transactionContext` setting typed `ITransactionContext<Kysely<...Tables>>`:
    - `KyselyCacheAdapter` (`KyselyCacheAdapterSettings`)
    - `KyselyCircuitBreakerStorageAdapter` (`KyselyCircuitBreakerStorageAdapterSettings`)
    - `KyselyLockAdapter` (`KyselyLockAdapterSettings`)
    - `KyselyRateLimiterStorageAdapter` (`KyselyRateLimiterStorageAdapterSettings`)
    - `KyselySemaphoreAdapter` (`KyselySemaphoreAdapterSettings`)
    - `KyselySharedLockAdapter` (`KyselySharedLockAdapterSettings`)

    Adapters given the same instance share the same transaction, reads and writes run on `transactionContext.current`, and multi-statement operations are wrapped in `transactionContext.run(...)`, which uses `REQUIRED` propagation, so an adapter called inside an ambient transaction joins it instead of opening a nested one. The private per-adapter transaction helpers that used to call `kysely.transaction()` were removed.
    - Lock, semaphore and shared-lock adapters no longer set the isolation level themselves. It now comes from the `isolationLevel` setting of `KyselyTransactionAdapter`, which defaults to `"serializable"` and therefore preserves the previous behavior unless it is overridden.
    - `init()` and `deInit()` keep using `transactionContext.client`, the base connection, because the table and index statements they run are not allowed inside a transaction. `removeAllExpired()` behaves the same way in `KyselyCacheAdapter`, `KyselyLockAdapter`, `KyselyRateLimiterStorageAdapter` and `KyselySemaphoreAdapter`, while `KyselySharedLockAdapter.removeAllExpired()` runs inside the transaction context like its other operations.

    ### Breaking changes
    - The `kysely` setting was renamed to `transactionContext` and a plain `Kysely` instance is no longer accepted, so every construction site has to be updated.

    ### Migration

    **Before:**

    ```ts
    const cacheAdapter = new KyselyCacheAdapter({
        kysely,
        serde,
    });
    ```

    **After:**

    ```ts
    const transactionContext = new TransactionContext({
        token: contextToken("kysely"),
        executionContext: new ExecutionContext(
            new AlsExecutionContextAdapter(),
        ),
        adapter: new KyselyTransactionAdapter({
            database: kysely,
        }),
    });

    const cacheAdapter = new KyselyCacheAdapter({
        transactionContext,
        serde,
    });
    ```

The `circuitBreakerStorageAdapterTestSuite` and `rateLimiterStorageAdapterTestSuite` functions accept a new optional `transactionAware` setting, which defaults to `true`. It controls the `method: transaction` describe block of the suite, asserting that changes are not persisted when the transaction fails and that they are persisted when the transaction succeeds. Adapters that are not transaction aware pass `false`, which `MemoryCircuitBreakerStorageAdapter` and `MemoryRateLimiterStorageAdapter` do, because they apply changes immediately and never roll them back.
