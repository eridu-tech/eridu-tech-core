---
"eridu-tech": minor
---

`LockFactoryResolver` initializes and retains an adapter-specific factory for each registered adapter during `init()`; call it before selecting a factory.

Lock serialization now uses the async-capable serde contract and defaults to `NoOpSerde`. Supply `SuperJsonSerde` or another serde explicitly when locks must be transformed across a serialization boundary.

The lock DI entrypoint exposes `ProxyLockFactoryResolver` as a directly constructible class that resolves the registered resolver lazily from the container, eliminating the separate DI factory helper. Proxy settings support the default TTL and lock ID generator.

### Breaking changes

- Replace `lockFactoryResolverDiFactory(container, token)` with `new ProxyLockFactoryResolver({ container, resolverToken })`.
- Import `ProxyLockFactoryResolver` from `eridu-tech/lock/di`; the proxy is now a public class constructed with one settings object.
