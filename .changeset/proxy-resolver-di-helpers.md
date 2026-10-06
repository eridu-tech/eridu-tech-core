---
"eridu-tech": minor
---

Replaced the `*/di` resolver factory helpers with directly constructible `Proxy*` classes.

Most of these DI integration entrypoints previously exported a `*DiFactory(container, token)` function that returned an internal proxy instance. Those functions are removed, and the proxies are now public classes that you construct with `new`. `eridu-tech/transaction-context/di` is new in the same style, without a prior factory helper to replace.

| Entrypoint                          | Before                                           | After                                                                         |
| ----------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------- |
| `eridu-tech/cache/di`               | `cacheResolverDiFactory(container, token)`       | `new ProxyCacheResolver({ container, resolverToken: token })`                 |
| `eridu-tech/circuit-breaker/di`     | `circuitBreakerFactoryResolverDiFactory(...)`    | `new ProxyCircuitBreakerFactoryResolver({ container, resolverToken: token })` |
| `eridu-tech/file-storage/di`        | `fileStorageResolverDiFactory(container, token)` | `new ProxyFileStorageResolver({ container, resolverToken: token })`           |
| `eridu-tech/lock/di`                | `lockFactoryResolverDiFactory(container, token)` | `new ProxyLockFactoryResolver({ container, resolverToken: token })`           |
| `eridu-tech/rate-limiter/di`        | `rateLimiterFactoryResolverDiFactory(...)`       | `new ProxyRateLimiterFactoryResolver({ container, resolverToken: token })`    |
| `eridu-tech/semaphore/di`           | `semaphoreFactoryResolverDiFactory(...)`         | `new ProxySemaphoreFactoryResolver({ container, resolverToken: token })`      |
| `eridu-tech/shared-lock/di`         | `sharedLockFactoryResolverDiFactory(...)`        | `new ProxySharedLockFactoryResolver({ container, resolverToken: token })`     |
| `eridu-tech/transaction-context/di` | —                                                | `new ProxyTransactionContextResolver({ container, resolverToken: token })`    |

```ts
import { CacheResolver } from "eridu-tech/cache";
import { ProxyCacheResolver } from "eridu-tech/cache/di";

const cacheResolver = new CacheResolver({
    adapters: { memory: new NoOpCacheAdapter() },
    defaultAdapter: "memory",
});
container.registerValue({ token: CacheResolver, value: cacheResolver });

const cache = new ProxyCacheResolver({
    container,
    resolverToken: CacheResolver,
});

await container.init();

await cache.get("key"); // delegates to the resolved CacheResolver
```

Each `Proxy*` class implements its module's resolver and factory contracts and resolves the registered resolver through the container on every operation with `IServiceResolver.resolveOrFail`, delegating `use()` and the factory methods (such as `create()`) to the result. Because resolution happens lazily, every lifetime is supported: singleton and transient registrations can be used once `IContainer.init()` has been awaited, while scoped registrations are resolved per operation and must be used inside `IContainer.run()`. The proxy can be constructed at any point, since it resolves the resolver on demand.

`use()` and `create()` return lightweight proxies whose operations resolve the resolver, so a created lock, semaphore, shared lock, circuit breaker, rate limiter, or file resolves the underlying resolver the first time one of its methods is invoked. `ProxyTransactionContextResolver` implements `ITransactionContextResolver`; its `use()` returns a lightweight `ITransactionRunner` and its `afterCommit()` resolves the resolver directly.

### Breaking changes

- The `*DiFactory` functions are removed from every `*/di` entrypoint that had one and are replaced by the exported `Proxy*` classes.
- Each `Proxy*` constructor now takes a single settings object — `new Proxy*({ container, resolverToken })` — instead of the positional `(container, token)` arguments.
- The proxy classes are no longer marked `@internal`; they are documented and exported under their new `Proxy*` names.

### Notes

- Every entrypoint also exports its `Proxy*` settings type (`ProxyCacheResolverSettings`, `ProxyLockFactoryResolverSettings`, `ProxySemaphoreFactoryResolverSettings`, …) describing `container`, `resolverToken`, and any module-specific defaults.
- `ProxyLockFactoryResolver`, `ProxySemaphoreFactoryResolver`, and `ProxySharedLockFactoryResolver` additionally accept the module's `defaultTtl` and ID generator (`createLockId`/`createSlotId`) settings, falling back to the same defaults as the corresponding `*Factory`.
- The proxy-specific "not ready" error is gone; calling an operation before `IContainer.init()` has been awaited surfaces the container's `InvalidMethodCallDiError`.
- The historical CHANGELOG entries keep the old `*DiFactory` names.
