---
"eridu-tech": minor
---

Rename the asynchronous pruning contract and add a synchronous variant in `eridu-tech/utilities/contracts`.

- The `IPrunable` contract whose `removeAllExpired()` returned a `Promise` is renamed to `IAsyncPrunable`.
- `IPrunable` now describes synchronous pruning with `removeAllExpired(): void`.
- `MongodbLockAdapter`, `MongodbSemaphoreAdapter`, `MongodbSharedLockAdapter`, `MongodbCircuitBreakerStorageAdapter`, `MemoryLockAdapter`, `MemorySemaphoreAdapter`, `MemorySharedLockAdapter`, `MemoryCacheAdapter`, `KyselyLockAdapter`, `KyselySemaphoreAdapter`, `KyselySharedLockAdapter` and `KyselyCacheAdapter` now implement `IAsyncPrunable`, so annotations using `IPrunable` for them must be updated.
