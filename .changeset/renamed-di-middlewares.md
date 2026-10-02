---
"eridu-tech": minor
---

Renamed the dependency-injection aware middlewares so their registrars are named after the factory they wrap.

Every `.../middlewares/di` entrypoint previously exported a `registerWithX` function. Those functions are now named `withXDiFactory`, matching the `withXFactory` middleware factory they delegate to. The folders and files that hold them were renamed from `with-x` to `with-x-factory-di` to match:

```ts
import { withLockDiFactory } from "eridu-tech/lock/middlewares/di";
import { LockFactory } from "eridu-tech/lock";
import { use } from "eridu-tech/middleware";

const withLock = withLockDiFactory(container, LockFactory);

async function createUser(id: string): Promise<void> {
    // ...
}

const createUserWithLock = use(
    createUser,
    withLock({ key: ([id]) => `user:${id}` }),
);
```

- `eridu-tech/cache/middlewares/di` exports `withCacheDiFactory` and `withInvalidationDiFactory`.
- `eridu-tech/circuit-breaker/middlewares/di` exports `withCircuitBreakerDiFactory`.
- `eridu-tech/event-bus/middlewares/di` exports `withDispatchBeforeDiFactory`, `withDispatchAfterDiFactory` and `withDispatchOnErrorDiFactory`.
- `eridu-tech/lock/middlewares/di` exports `withLockDiFactory`.
- `eridu-tech/rate-limiter/middlewares/di` exports `withRateLimiterDiFactory`.
- `eridu-tech/semaphore/middlewares/di` exports `withSemaphoreDiFactory`.
- `eridu-tech/shared-lock/middlewares/di` exports `withSharedLockDiFactory`.
- `eridu-tech/transaction-context/middlewares/di` exports `withTransactionDiFactory` and `withAfterCommitDiFactory`.

### Breaking changes

- Renamed every DI middleware registrar exported from a `.../middlewares/di` entrypoint:
    - `registerWithCache` → `withCacheDiFactory`
    - `registerWithInvalidation` → `withInvalidationDiFactory`
    - `registerWithCircuitBreaker` → `withCircuitBreakerDiFactory`
    - `registerWithDispatchBefore` → `withDispatchBeforeDiFactory`
    - `registerWithDispatchAfter` → `withDispatchAfterDiFactory`
    - `registerWithDispatchOnError` → `withDispatchOnErrorDiFactory`
    - `registerWithLock` → `withLockDiFactory`
    - `registerWithRateLimiter` → `withRateLimiterDiFactory`
    - `registerWithSemaphore` → `withSemaphoreDiFactory`
    - `registerWithSharedLock` → `withSharedLockDiFactory`
    - `registerWithTransaction` → `withTransactionDiFactory`
    - `registerWithAfterCommit` → `withAfterCommitDiFactory`
- Renamed the `.../middlewares/di/with-x/*` folders and files to `.../middlewares/di/with-x-factory-di/*`, so deep imports into those folders no longer resolve.

### Migration

Update the imported registrar name. For deep imports, also update the `with-x` path segment to `with-x-factory-di` and the file name to match:

**Before:**

```ts
import { registerWithLock } from "eridu-tech/lock/middlewares/di";
```

**After:**

```ts
import { withLockDiFactory } from "eridu-tech/lock/middlewares/di";
```
