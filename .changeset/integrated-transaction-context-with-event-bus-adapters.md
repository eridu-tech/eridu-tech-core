---
"eridu-tech": minor
---

The `MemoryEventBusAdapter` and `RedisPubSubEventBusAdapter` can now defer event dispatching until the active transaction commits.

- Added an optional `transactionHooks` setting of type `ITransactionHooks` to `MemoryEventBusAdapterSettings` and `RedisPubSubEventBusAdapterSettings`. `dispatch()` is now wrapped in `transactionHooks.afterCommit()`, so events are only emitted or published once the active transaction commits. When no transaction is active, events are still dispatched immediately. The setting defaults to `TransactionContext.noOp(null)`, so events keep being dispatched immediately and unconditionally, exactly as they were before this change.

- `MemoryEventBusAdapter` now accepts a settings object instead of a positional `EventEmitter`, so an `EventEmitter` is provided through the new optional `eventEmitter` setting (defaults to `new EventEmitter()`).

    ### Breaking changes
    - `new MemoryEventBusAdapter(eventEmitter?)` was replaced with `new MemoryEventBusAdapter({ eventEmitter?, transactionHooks? })`.

    ### Migration

    **Before:**

    ```ts
    const eventBusAdapter = new MemoryEventBusAdapter(eventEmitter);
    ```

    **After:**

    ```ts
    const eventBusAdapter = new MemoryEventBusAdapter({ eventEmitter });
    ```

- The `RedisPubSubEventBusAdapter` constructor signature is unchanged, since its settings were already passed as an object. Its `dispatch()` now publishes through `transactionHooks.afterCommit()`.

- Added after-commit integration tests to both adapters.
