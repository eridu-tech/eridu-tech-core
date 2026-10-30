---
"eridu-tech": minor
---

Removed `SingleResourcePool` from `eridu-tech/generic-pool` because it was not needed.

`SingleResourcePool` existed to give exactly one caller access to a client at a time, but the same behaviour is already covered by the other pool implementations, so it added no value of its own. Use `QueuePool` when concurrent callers must each borrow a resource, or `NoOpPool` when a client is already exclusive.

### Breaking changes

- `eridu-tech/generic-pool` no longer exports `SingleResourcePool` or its `SinglePoolSettings` type, so imports of those names no longer resolve.
