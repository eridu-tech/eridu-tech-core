---
"eridu-tech": minor
---

`SemaphoreFactoryResolver` initializes and retains adapter-specific factories during `init()`; call it before selecting a factory.

Semaphore serialization now uses the async-capable serde contract and defaults to `NoOpSerde`. Supply `SuperJsonSerde` or another serde explicitly when semaphores must be transformed across a serialization boundary.

The semaphore DI entrypoint exposes `ProxySemaphoreFactoryResolver` as a directly constructible class that resolves the registered resolver lazily from the container, eliminating the separate DI factory helper. Proxy settings support the default TTL and slot ID generator.

### Breaking changes

- Replace `semaphoreFactoryResolverDiFactory(container, token)` with `new ProxySemaphoreFactoryResolver({ container, resolverToken })`.
- Import `ProxySemaphoreFactoryResolver` from `eridu-tech/semaphore/di`; the proxy is now a public class constructed with one settings object.
