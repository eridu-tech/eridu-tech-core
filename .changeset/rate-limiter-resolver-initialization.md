---
"eridu-tech": minor
---

`RateLimiterFactoryResolver` initializes and retains adapter-specific factories during `init()`; call it before selecting a factory. The database-specific resolver implementation was removed in favor of the generic adapter resolver.

Rate-limiter serialization now uses the async-capable serde contract and defaults to `NoOpSerde`. Supply `SuperJsonSerde` or another serde explicitly when rate limiters must be transformed across a serialization boundary.

The rate-limiter DI entrypoint exposes `ProxyRateLimiterFactoryResolver` as a directly constructible class that resolves the registered resolver lazily from the container. Construct the proxy directly instead of going through a separate DI factory helper.

### Breaking changes

- Replace `rateLimiterFactoryResolverDiFactory(container, token)` with `new ProxyRateLimiterFactoryResolver({ container, resolverToken })`.
- Import `ProxyRateLimiterFactoryResolver` from `eridu-tech/rate-limiter/di`; the proxy is now a public class constructed with one settings object.
