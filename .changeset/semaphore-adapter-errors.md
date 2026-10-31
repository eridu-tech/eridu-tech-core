---
"eridu-tech": minor
---

New `UnableTo` errors that describe a semaphore adapter failure, available from `eridu-tech/semaphore/contracts`:

- `UnableToAcquireSemaphoreError`
- `UnableToReleaseSemaphoreError`
- `UnableToForceReleaseAllSemaphoreError`
- `UnableToRefreshSemaphoreError`
- `UnableToGetStateSemaphoreError`

They are registered in `SEMAPHORE_ERRORS`, so `isSemaphoreError()` and `AllSemaphoreErrors` include them. Each error wraps the unexpected adapter error as its `cause`, and `getState()` and the `ISemaphoreBase` methods now document the `UnableTo` error they can throw when the underlying adapter fails, alongside the existing `LimitReached`, `FailedRefresh` and `FailedRelease` errors.

The new `handleUnexpectedSemaphoreAdapterError` plugin applies that mapping to every adapter method. `SemaphoreFactory` wraps the provided adapter with it internally, so `try`/`catch` covers `acquire`, `release`, `forceReleaseAll`, `refresh` and `getState` and rethrows the matching `UnableTo*SemaphoreError` with the original error as its cause. Semaphores created by the factory, including deserialized ones, therefore only reject with semaphore errors.
