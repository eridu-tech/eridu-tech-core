---
"eridu-tech": minor
---

`CircuitBreakerFactoryResolver` now initializes its adapter-specific factories during `init()`; call it before selecting a factory. The database-specific resolver implementation was removed in favor of the generic adapter resolver.

The circuit-breaker factory now uses the async-capable serde contract and defaults to `NoOpSerde`. Supply `SuperJsonSerde` or another serde explicitly when serialized circuit breakers must be transformed across a boundary.

The circuit-breaker DI entrypoint exposes `ProxyCircuitBreakerFactoryResolver` as a directly constructible class that resolves the registered resolver lazily from the container. Construct the proxy directly instead of going through a separate DI factory helper.

### Breaking changes

- Replace `circuitBreakerFactoryResolverDiFactory(container, token)` with `new ProxyCircuitBreakerFactoryResolver({ container, resolverToken })`.
- Import `ProxyCircuitBreakerFactoryResolver` from `eridu-tech/circuit-breaker/di`; the proxy is now a public class constructed with one settings object.
