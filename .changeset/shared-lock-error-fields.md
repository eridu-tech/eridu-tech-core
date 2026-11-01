---
"eridu-tech": minor
---

Error instances in `eridu-tech/shared-lock/contracts` now expose the shared-lock identifiers they were created for.

Reader semaphore errors:

- `LimitReachedReaderSemaphoreError.key`
- `FailedRefreshReaderSemaphoreError.key` and `FailedRefreshReaderSemaphoreError.slotId`
- `FailedReleaseReaderSemaphoreError.key` and `FailedReleaseReaderSemaphoreError.slotId`
- `UnableToAcquireReaderSemaphoreError.key`
- `UnableToReleaseReaderSemaphoreError.key` and `UnableToReleaseReaderSemaphoreError.slotId`
- `UnableToRefreshReaderSemaphoreError.key` and `UnableToRefreshReaderSemaphoreError.slotId`

Writer lock errors:

- `FailedAcquireWriterLockError.key`
- `FailedReleaseWriterLockError.key` and `FailedReleaseWriterLockError.lockId`
- `FailedRefreshWriterLockError.key` and `FailedRefreshWriterLockError.lockId`
- `UnableToAcquireWriterLockError.key` and `UnableToAcquireWriterLockError.lockId`
- `UnableToReleaseWriterLockError.key` and `UnableToReleaseWriterLockError.lockId`
- `UnableToRefreshWriterLockError.key` and `UnableToRefreshWriterLockError.lockId`

Shared-lock errors:

- `UnableToForceReleaseSharedLockError.key`
- `UnableToGetStateSharedLockError.key`

Each `create()` factory passes the identifiers to the error, so they are available as `readonly` fields alongside the existing `message` and `cause`.
