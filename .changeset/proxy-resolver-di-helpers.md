---
"eridu-tech": minor
---

Replaced the `*/di` resolver factory helpers with directly constructible `Proxy*` classes.

Each DI integration entrypoint previously exported a `*DiFactory(container, token)` function that returned an internal proxy instance. Those functions are removed, and the proxies are now public classes that you construct with `new`.

| Entrypoint                      | Before                                           | After                                                      |
| ------------------------------- | ------------------------------------------------ | ---------------------------------------------------------- |
| `eridu-tech/cache/di`           | `cacheResolverDiFactory(container, token)`       | `new ProxyCacheResolver(container, token)`                 |
| `eridu-tech/circuit-breaker/di` | `circuitBreakerFactoryResolverDiFactory(...)`    | `new ProxyCircuitBreakerFactoryResolver(container, token)` |
| `eridu-tech/file-storage/di`    | `fileStorageResolverDiFactory(container, token)` | `new ProxyFileStorageResolver(container, token)`           |
| `eridu-tech/lock/di`            | `lockFactoryResolverDiFactory(container, token)` | `new ProxyLockFactoryResolver(container, token)`           |
| `eridu-tech/rate-limiter/di`    | `rateLimiterFactoryResolverDiFactory(...)`       | `new ProxyRateLimiterFactoryResolver(container, token)`    |
| `eridu-tech/semaphore/di`       | `semaphoreFactoryResolverDiFactory(...)`         | `new ProxySemaphoreFactoryResolver(container, token)`      |
| `eridu-tech/shared-lock/di`     | `sharedLockFactoryResolverDiFactory(...)`        | `new ProxySharedLockFactoryResolver(container, token)`     |

```ts
import { CacheResolver } from "eridu-tech/cache";
import { ProxyCacheResolver } from "eridu-tech/cache/di";

const cacheResolver = new CacheResolver({
    adapters: { memory: new NoOpCacheAdapter() },
    defaultAdapter: "memory",
});
container.registerValue({ token: CacheResolver, value: cacheResolver });

// Create the proxy before container.init()
const cache = new ProxyCacheResolver(container, CacheResolver);

await container.init();

await cache.get("key"); // delegates to the resolved CacheResolver
```

Behavior is unchanged: each `Proxy*` class implements its module's resolver and factory contracts, resolves the registered resolver once during `IContainer.init()`, and delegates `use()` and the factory methods (such as `create()`) to it. Construct the instance before `init()`; calling `use()` or a factory method before `init()` is awaited throws.

### Breaking changes

- The `*DiFactory` functions are removed from every `*/di` entrypoint listed above and are replaced by the exported `Proxy*` classes.
- `new Proxy*(container, token)` takes the same arguments in the same order as the removed factory, so each call site migrates with a one-line change.
- The proxy classes are no longer marked `@internal`; they are documented and exported under their new `Proxy*` names.

### Notes

- The "not ready" error message now points at `IContainer.init()` instead of the previous (non-existent) `ready()` method.
- The historical CHANGELOG entries keep the old `*DiFactory` names.
