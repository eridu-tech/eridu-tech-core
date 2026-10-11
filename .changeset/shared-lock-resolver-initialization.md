---
"eridu-tech": minor
---

`SharedLockFactoryResolver` initializes and retains adapter-specific factories during `init()`; call it before selecting a factory.

Shared-lock serialization now uses the async-capable serde contract and defaults to `NoOpSerde`. Supply `SuperJsonSerde` or another serde explicitly when shared locks must be transformed across a serialization boundary.

The shared-lock DI entrypoint exposes `ProxySharedLockFactoryResolver` as a directly constructible class that resolves the registered resolver lazily from the container, eliminating the separate DI factory helper. Proxy settings support the default TTL and lock ID generator.

### Breaking changes

- Replace `sharedLockFactoryResolverDiFactory(container, token)` with `new ProxySharedLockFactoryResolver({ container, resolverToken })`.
- Import `ProxySharedLockFactoryResolver` from `eridu-tech/shared-lock/di`; the proxy is now a public class constructed with one settings object.
