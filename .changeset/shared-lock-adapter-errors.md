---
"eridu-tech": minor
---

New `UnableTo` errors that describe a shared-lock adapter failure, available from `eridu-tech/shared-lock/contracts`:

- `UnableToAcquireReaderSemaphoreError`
- `UnableToReleaseReaderSemaphoreError`
- `UnableToRefreshReaderSemaphoreError`
- `UnableToAcquireWriterLockError`
- `UnableToReleaseWriterLockError`
- `UnableToRefreshWriterLockError`
- `UnableToForceReleaseSharedLockError`
- `UnableToGetStateSharedLockError`

They are registered in `READER_SEMAPHORE_ERRORS`, `WRITER_LOCK_ERRORS` and `SHARED_LOCK_ERRORS`, so `isSharedLockError()` and `AllSharedLockErrors` include them. Each error wraps the unexpected adapter error as its `cause`, and `getState()` and the `ISharedLockBase` methods now document the `UnableTo` error they can throw when the underlying adapter fails, alongside the existing errors.

The new `handleUnexpectedSharedLockAdapterError` plugin applies that mapping to every adapter method. `SharedLockFactory` wraps the provided adapter with it internally, so `try`/`catch` covers `acquireWriter`, `releaseWriter`, `refreshWriter`, `acquireReader`, `releaseReader`, `refreshReader`, `forceRelease` and `getState` and rethrows the matching error with the original error as its cause. Shared locks created by the factory, including deserialized ones, therefore only reject with shared lock errors.
