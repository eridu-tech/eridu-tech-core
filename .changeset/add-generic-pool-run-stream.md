---
"eridu-tech": minor
---

Add `runStream` to the generic pool so a stream can borrow a client for its whole lifetime.

- `IGenericPoolBase.runStream(stream, client)` binds an `AsyncIterable` to an already acquired client and releases that client exactly once when iteration ends: after the stream is drained, when the consumer stops early (`break` or `iterator.return()`), and when the iterable throws. The release is awaited after the wrapped stream has closed, so the client is never handed back midway through teardown.
- `runStream` is synchronous and returns the bound `AsyncIterable` directly. It does not acquire a client, so the caller passes one obtained with `acquireOrFail`.
- A stream that is never iterated does not release its client. Call `release` in your own `finally` block when you bind a stream and never consume it.
- `QueuePool` and `NoOpPool` implement the new member, and `runStream` is part of `IGenericPoolBase` exported from `eridu-tech/generic-pool/contracts`.
