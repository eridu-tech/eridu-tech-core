---
"eridu-tech": minor
---

Add `ToSemaphoreAdapter`, which exposes a shared lock adapter as a semaphore adapter.

- `ToSemaphoreAdapter` implements `ISemaphoreAdapter` using the reader side of an `ISharedLockAdapter`: the semaphore `slotId` becomes the reader `lockId`, `limit` is forwarded to the shared lock, and `forceReleaseAll` releases the entire shared lock.
- `getState` reports the reader semaphore, so a shared lock held by a writer is reported as `null`.
- Import it from `eridu-tech/semaphore/to-semaphore-adapter`.
