---
"eridu-tech": minor
---

Added dependency-injection aware factory resolver helpers for the cache, circuit breaker, file storage, lock, rate limiter, semaphore and shared lock modules. Each helper takes a container and the token its resolver is registered under, and returns a proxy that delegates to that resolver once `IContainer.init()` has run, so a resolver can be pulled from the container instead of being constructed by hand.

```ts
import { Container } from "eridu-tech/di";
import { CacheResolver } from "eridu-tech/cache";
import { cacheResolverDiFactory } from "eridu-tech/cache/di";
import { NoOpCacheAdapter } from "eridu-tech/cache/no-op-cache-adapter";
import { ExecutionContext } from "eridu-tech/execution-context";
import { AlsExecutionContextAdapter } from "eridu-tech/execution-context/als-execution-context-adapter";

const executionContext = new ExecutionContext(new AlsExecutionContextAdapter());
const container = new Container({ executionContext });

const cacheResolver = new CacheResolver({
    adapters: { memory: new NoOpCacheAdapter() },
    defaultAdapter: "memory",
});
container.registerValue({ token: CacheResolver, value: cacheResolver });

// Create the proxy before init(), then use it after init() has run.
const cache = cacheResolverDiFactory(container, CacheResolver);

await container.init();

await cache.put("key", "value");
await cache.use("memory").get("key");
```

- `eridu-tech/cache/di` exports `cacheResolverDiFactory(container, cacheResolverToken)`, returning an `ICacheResolver & ICache` proxy.
- `eridu-tech/circuit-breaker/di` exports `circuitBreakerFactoryResolverDiFactory(container, circuitBreakerFactoryResolverToken)`, returning an `ICircuitBreakerFactoryResolver & ICircuitBreakerFactory` proxy.
- `eridu-tech/file-storage/di` exports `fileStorageResolverDiFactory(container, fileStorageResolverToken)`, returning an `IFileStorageResolver & IFileStorage` proxy.
- `eridu-tech/lock/di` exports `lockFactoryResolverDiFactory(container, lockFactoryResolverToken)`, returning an `ILockFactoryResolver & ILockFactory` proxy.
- `eridu-tech/rate-limiter/di` exports `rateLimiterFactoryResolverDiFactory(container, rateLimiterFactoryResolverToken)`, returning an `IRateLimiterFactoryResolver & IRateLimiterFactory` proxy.
- `eridu-tech/semaphore/di` exports `semaphoreFactoryResolverDiFactory(container, semaphoreFactoryResolverToken)`, returning an `ISemaphoreFactoryResolver & ISemaphoreFactory` proxy.
- `eridu-tech/shared-lock/di` exports `sharedLockFactoryResolverDiFactory(container, sharedLockFactoryResolverToken)`, returning an `ISharedLockFactoryResolver & ISharedLockFactory` proxy.

### Details

- The token is resolved once during `container.init()`, so the helper must be created before `init()` is awaited. Until then, `use()` and the delegated operations throw.
- The token must be registered; otherwise `container.init()` throws `CanNotResolveServiceDiError`.
- The returned proxy implements both the resolver interface and the operations interface of its module, so it can be used directly without calling `use()`: operations run against the resolver's default adapter, while `use(adapterName)` selects a specific one.
- Every helper is typed with a `TAdapters` generic that defaults to `string`, so the registered adapter names can be narrowed at the call site.
