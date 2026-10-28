---
"eridu-tech": minor
---

New `generic-pool` component for reusing expensive resources such as database connections or SFTP clients.

- `eridu-tech/generic-pool/contracts` exposes the `IResourceFactory`, `IGenericPoolBase`, `IGenericPool` and `Poolable` types.
- `QueuePool` creates resources through an `IResourceFactory` and queues callers in FIFO order when none are idle. The pool size is bounded by `maxResources` (default `10`) and the wait queue by `maxWaitSize` (default `null`, meaning unbounded).
- Resource recycling goes through `IResourceFactory.validate()`, so an unusable resource is destroyed and replaced instead of being handed to the next caller.
- `SingleResourcePool` lets exactly one caller use a client at a time, queueing the rest up to `maxWaitSize`.
- `NoOpPool` hands the same client to every caller and ignores releases, which is useful when a client is already exclusive.
- `acquireOrFail()` rejects with `UnableToAcquireError` when the pool is closed or the wait queue is full.
- `eridu-tech/generic-pool` re-exports the implementations, and `eridu-tech/generic-pool/contracts` re-exports the types and errors.
