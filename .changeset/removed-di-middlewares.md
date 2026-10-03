---
"eridu-tech": minor
---

Removed the dependency-injection aware middleware registrars and their `eridu-tech/*/middlewares/di` package exports.

The registrars resolved a middleware's dependency from an `IContainer` and returned the same middleware the matching factory produces. The same result is available by resolving the dependency from the container and passing it to the factory, so the DI-specific copies were redundant.

- Removed the `eridu-tech/cache/middlewares/di` entry point (`registerWithCache`, `registerWithInvalidation`).
- Removed the `eridu-tech/circuit-breaker/middlewares/di` entry point (`registerWithCircuitBreaker`).
- Removed the `eridu-tech/event-bus/middlewares/di` entry point (`registerWithDispatchBefore`, `registerWithDispatchAfter`, `registerWithDispatchOnError`).
- Removed the `eridu-tech/lock/middlewares/di` entry point (`registerWithLock`).
- Removed the `eridu-tech/rate-limiter/middlewares/di` entry point (`registerWithRateLimiter`).
- Removed the `eridu-tech/semaphore/middlewares/di` entry point (`registerWithSemaphore`).
- Removed the `eridu-tech/shared-lock/middlewares/di` entry point (`registerWithSharedLock`).
- Removed the `eridu-tech/transaction-context/middlewares/di` entry point (`registerWithTransaction`, `registerWithAfterCommit`).

### Breaking changes

- The `eridu-tech/*/middlewares/di` package exports no longer resolve.

### Migration

Resolve the dependency from the container and pass it to the matching middleware factory. The `eridu-tech/*/di` resolver helpers return a proxy that delegates to the container once `IContainer.init()` has run, so the helper can be created before `init()` and used after it.

**Before:**

```ts
import { registerWithLock } from "eridu-tech/lock/middlewares/di";

const withLock = registerWithLock(container, LOCK_FACTORY);
```

**After:**

```ts
import { lockFactoryResolverDiFactory } from "eridu-tech/lock/di";
import { withLockFactory } from "eridu-tech/lock/middlewares";

const lockFactory = lockFactoryResolverDiFactory(container, LOCK_FACTORY);
const withLock = withLockFactory(lockFactory);
```

The resolver proxy reads from the container once during `IContainer.init()`.
