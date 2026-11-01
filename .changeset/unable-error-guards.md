---
"eridu-tech": minor
---

Added `UnableTo` error guards and registries so adapter failures can be detected without checking every error class:

- `isUnableToLockError()` / `AllUnableLockErrors` / `UNABLE_LOCK_ERRORS`
- `isUnableToSemaphoreError()` / `AllUnableSemaphoreErrors` / `UNABLE_SEMAPHORE_ERRORS`
- `isUnableToRateLimiterError()` / `AllUnableRateLimiterErrors` / `UNABLE_RATE_LIMITER_ERRORS`
- `isUnableToEventBusError()` / `AllUnableEventBusErrors` / `UNABLE_EVENT_BUS_ERRORS`
- `isUnableToFileError()` / `AllUnableFileErrors` / `UNABLE_FILE_STORAGE_ERRORS`
- `isUnableToReaderSemaphoreError()` / `AllUnableReaderSemaphoreErrors` / `UNABLE_READER_SEMAPHORE_ERRORS`
- `isUnableToWriterLockError()` / `AllUnableWriterLockErrors` / `UNABLE_WRITER_LOCK_ERRORS`
- `isUnableToSharedLockError()` / `AllUnableSharedLockErrors` / `UNABLE_SHARED_LOCK_ERRORS`

`LOCK_ERRORS`, `SEMAPHORE_ERRORS`, `RATE_LIMITER_ERRORS`, `EVENT_BUS_ERRORS`, `FILE_STORAGE_ERRORS`, `READER_SEMAPHORE_ERRORS`, `WRITER_LOCK_ERRORS` and `SHARED_LOCK_ERRORS` now spread their matching `UNABLE_*_ERRORS` registry, so the existing `is*Error()` guards and `All*Errors` types keep matching every adapter error.
