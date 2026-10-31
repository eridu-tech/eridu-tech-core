---
"eridu-tech": minor
---

New `UnableTo` errors that describe a lock adapter failure, available from `eridu-tech/lock/contracts`:

- `UnableToAcquireLockError`
- `UnableToReleaseLockError`
- `UnableToForceReleaseLockError`
- `UnableToRefreshLockError`
- `UnableToGetStateLockError`

They are registered in `LOCK_ERRORS`, so `isLockError()` and `AllLockErrors` include them. Each error wraps the unexpected adapter error as its `cause`, and `getState()` and the `ILockBase` methods now document the `UnableTo` error they can throw when the underlying adapter fails, alongside the existing `Failed*` errors.

The new `handleUnexpectedLockAdapterError` plugin applies that mapping to every adapter method. `LockFactory` wraps the provided adapter with it internally, so `try`/`catch` covers `acquire`, `release`, `forceRelease`, `refresh` and `getState` and rethrows the matching `UnableTo*LockError` with the original error as its cause. Locks created by the factory, including deserialized ones, therefore only reject with lock errors.
