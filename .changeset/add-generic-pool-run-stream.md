---
"eridu-tech": minor
---

Add `runStream` to the generic pool so a stream can borrow a client for its whole lifetime.

- `IGenericPoolBase.runStream(settings)` binds an `AsyncIterable` to a pooled client and releases that client exactly once when iteration ends: after the stream is drained, when the consumer stops early (`break` or `iterator.return()`), and when the iterable throws. The release is awaited after the wrapped stream has closed, so the client is never handed back midway through teardown.
- `RunStreamSettings<TValue, TClient>` is the new settings type. `stream` is the iterable to bind. `client` is optional: pass a client you already acquired so the same stream does not acquire a second one, or omit it and the pool acquires and releases a client for you.
- `QueuePool` and `NoOpPool` implement the new member, and both `runStream` and `RunStreamSettings` are exported from `eridu-tech/generic-pool/contracts`.
