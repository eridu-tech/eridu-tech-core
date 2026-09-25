---
"eridu-tech": minor
---

Added dependency-injection aware middlewares for the `cache`, `circuit-breaker`, `event-bus`, `lock`, `rate-limiter`, `semaphore`, `shared-lock` and `transaction-context` components.

Every component that ships middleware factories now also ships a `.../middlewares/di` entrypoint. A DI registrar takes an `IContainer` and a `DiToken`, resolves the dependency for the middleware, and returns the same middleware the matching factory would return. Middlewares can therefore be declared against a token instead of a hand-resolved instance:

```ts
import { registerWithLock } from "eridu-tech/lock/middlewares/di";
import { LockFactory } from "eridu-tech/lock";
import { use } from "eridu-tech/middleware";

const withLock = registerWithLock(container, LockFactory);

async function createUser(id: string): Promise<void> {
    // ...
}

const createUserWithLock = use(
    createUser,
    withLock({ key: ([id]) => `user:${id}` }),
);
```

- `eridu-tech/cache/middlewares/di` exports `registerWithCache` and `registerWithInvalidation`.
- `eridu-tech/circuit-breaker/middlewares/di` exports `registerWithCircuitBreaker`.
- `eridu-tech/event-bus/middlewares/di` exports `registerWithDispatchBefore`, `registerWithDispatchAfter` and `registerWithDispatchOnError`.
- `eridu-tech/lock/middlewares/di` exports `registerWithLock`.
- `eridu-tech/rate-limiter/middlewares/di` exports `registerWithRateLimiter`.
- `eridu-tech/semaphore/middlewares/di` exports `registerWithSemaphore`.
- `eridu-tech/shared-lock/middlewares/di` exports `registerWithSharedLock`.
- `eridu-tech/transaction-context/middlewares/di` exports `registerWithTransaction` and `registerWithAfterCommit`.

### Details

- The token is resolved on every invocation of the wrapped function, so a token that is overridden or scoped after the middleware is built still takes effect.
- Every registrar accepts the same settings (or propagation argument) as its matching factory and returns a middleware with the same signature.
- Registering a token that the container does not know about fails with `CanNotResolveServiceDiError` on invocation.
- The existing `.../middlewares` entrypoints are unchanged, so this is purely additive.
