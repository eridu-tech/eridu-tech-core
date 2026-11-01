---
"eridu-tech": minor
---

Error instances in `eridu-tech/lock/contracts` now expose the lock identifiers they were created for:

- `FailedAcquireLockError.key`
- `FailedReleaseLockError.key` and `FailedReleaseLockError.lockId`
- `FailedRefreshLockError.key` and `FailedRefreshLockError.lockId`
- `UnableToAcquireLockError.key`
- `UnableToReleaseLockError.key` and `UnableToReleaseLockError.lockId`
- `UnableToForceReleaseLockError.key`
- `UnableToRefreshLockError.key` and `UnableToRefreshLockError.lockId`
- `UnableToGetStateLockError.key`

Each `create()` factory passes the identifiers to the error, so they are available as `readonly` fields alongside the existing `message` and `cause`.
