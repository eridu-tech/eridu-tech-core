---
"eridu-tech": minor
---

Error instances in `eridu-tech/semaphore/contracts` now expose the semaphore identifiers they were created for:

- `LimitReachedSemaphoreError.key`
- `FailedRefreshSemaphoreError.key` and `FailedRefreshSemaphoreError.slotId`
- `FailedReleaseSemaphoreError.key` and `FailedReleaseSemaphoreError.slotId`
- `UnableToAcquireSemaphoreError.key`
- `UnableToReleaseSemaphoreError.key` and `UnableToReleaseSemaphoreError.slotId`
- `UnableToForceReleaseAllSemaphoreError.key`
- `UnableToRefreshSemaphoreError.key` and `UnableToRefreshSemaphoreError.slotId`
- `UnableToGetStateSemaphoreError.key`

Each `create()` factory passes the identifiers to the error, so they are available as `readonly` fields alongside the existing `message` and `cause`.
