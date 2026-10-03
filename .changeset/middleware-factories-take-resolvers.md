---
"eridu-tech": minor
---

The lock, shared-lock, semaphore, rate-limiter and circuit-breaker middlewares now take a factory resolver instead of a single factory, and expose a `use(adapterName)` method for selecting a specific adapter. This mirrors `withCacheFactory`, so the value can be passed straight from the matching `eridu-tech/*/di` helper or constructed with the `*FactoryResolver` class.

```ts
import { withLockFactory } from "eridu-tech/lock/middlewares";
import { LockFactoryResolver } from "eridu-tech/lock";
import { MemoryLockAdapter } from "eridu-tech/lock/memory-lock-adapter";

const lockFactoryResolver = new LockFactoryResolver({
    adapters: { memory: new MemoryLockAdapter() },
    defaultAdapter: "memory",
});

const withLock = withLockFactory(lockFactoryResolver);

// Uses the default adapter.
await use(processJob, withLock({ key: ([jobId]) => `job:${jobId}` }))("1");

// Uses the explicit adapter.
await use(
    processJob,
    withLock.use("memory")({ key: ([jobId]) => `job:${jobId}` }),
)("1");
```

- `withLockFactory`, `withSharedLockFactory`, `withSemaphoreFactory`, `withRateLimiterFactory` and `withCircuitBreakerFactory` now accept an `I<Name>FactoryResolver` and return a callable that is also a resolver. Calling the result uses the resolver's default adapter; `use(adapterName)` selects a specific one.
- `eridu-tech/lock/middlewares` exports `CreateLockResolver`, `WithLock` and `WithLockResolver`.
- `eridu-tech/shared-lock/middlewares` exports `CreateSharedLockResolver`, `WithSharedLock` and `WithSharedLockResolver`.
- `eridu-tech/semaphore/middlewares` exports `CreateSemaphoreResolver`, `WithSemaphore` and `WithSemaphoreResolver`.
- `eridu-tech/rate-limiter/middlewares` exports `CreateRateLimiterResolver`, `WithRateLimiter` and `WithRateLimiterResolver`.
- `eridu-tech/circuit-breaker/middlewares` exports `CreateCircuitBreakerResolver`, `WithCircuitBreaker` and `WithCircuitBreakerResolver`.

### Breaking changes

- The five middleware factories no longer accept a bare factory. Passing a `LockFactory`, `SharedLockFactory`, `SemaphoreFactory`, `RateLimiterFactory` or `CircuitBreakerFactory` no longer compiles; pass the matching resolver instead.

### Migration

**Before:**

```ts
const lockFactory = new LockFactory({ adapter: new MemoryLockAdapter() });
const withLock = withLockFactory(lockFactory);
```

**After:**

```ts
const lockFactoryResolver = new LockFactoryResolver({
    adapters: { memory: new MemoryLockAdapter() },
    defaultAdapter: "memory",
});
const withLock = withLockFactory(lockFactoryResolver);
```
