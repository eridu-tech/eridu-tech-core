---
"eridu-tech": minor
---

Updated `CacheResolver` to initialize and retain adapter-specific caches. Call `init()` before selecting a cache adapter.

The cache DI entrypoint now exposes `ProxyCacheResolver` as a directly constructible class that resolves the registered resolver lazily from the container. This removes the extra DI factory helper from setup.

### Breaking changes

- Replace `cacheResolverDiFactory(container, token)` with `new ProxyCacheResolver({ container, resolverToken })`.
- Import `ProxyCacheResolver` from `eridu-tech/cache/di`; the proxy is now a public class constructed with one settings object.
