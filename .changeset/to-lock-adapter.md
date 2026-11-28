---
"eridu-tech": minor
---

Add `ToLockAdapter`, which exposes a shared lock adapter as a lock adapter.

- `ToLockAdapter` implements `ILockAdapter` using the writer side of an `ISharedLockAdapter`: `acquire`, `release` and `refresh` map to `acquireWriter`, `releaseWriter` and `refreshWriter`, while `forceRelease` releases the entire shared lock.
- `getState` reports the writer lock, so a shared lock held only by readers has no owner and is reported as `null`.
- Import it from `eridu-tech/lock/to-lock-adapter`.
