---
"eridu-tech": minor
---

Add `runStream` to the lock, semaphore and shared lock so a stream can run while holding the lock or slot for its whole lifetime.

- `ILock.runStream(stream)` wraps an `AsyncIterable` so the lock is acquired when iteration starts and released exactly once when it ends: after the stream is drained, when the consumer stops early (`break` or `iterator.return()`), and when the iterable throws. Nothing is acquired until the first value is requested, so building the stream is free.
- `ISemaphore.runStream(stream)` does the same for a semaphore slot: a slot is acquired before the first value is yielded and released exactly once afterwards.
- `ISharedLock.runReaderStream(stream)` and `ISharedLock.runWriterStream(stream)` add the reader and writer variants: a reader slot or the writer lock is acquired before the first value and released exactly once afterwards.
- When acquiring fails, iteration throws before any value is yielded (`FailedAcquireLockError`, `LimitReachedSemaphoreError`, `FailedAcquireWriterLockError`, `LimitReachedReaderSemaphoreError`, ...) and no release is attempted, because nothing was acquired.
- The release is awaited, so the held lock or slot is never given back midway through teardown.
- `ProxyLock`, `ProxySemaphore` and `ProxySharedLock` implement the new members, and the lock, semaphore and shared-lock factory test suites now cover them.
