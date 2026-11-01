---
sidebar_position: 9
sidebar_label: DI integration
pagination_label: CircuitBreaker DI container integration
tags:
    - CircuitBreaker
    - DI
    - Dependency injection
keywords:
    - CircuitBreaker
    - DI
    - Dependency injection
---

# DI Integration

The `circuitBreakerFactoryResolverDiFactory` function creates an [`ICircuitBreakerFactoryResolver`](../circuit_breaker_factory_resolver/index.md) whose underlying resolver is resolved from a [DI container](../../../foundation/di/index.md).

The returned proxy implements both `ICircuitBreakerFactoryResolver` and `ICircuitBreakerFactory`:

- `use(adapterName?)` selects an adapter on the resolved `CircuitBreakerFactoryResolver`.
- `create(key, settings?)` creates a circuit breaker through the resolver's default adapter.

The proxy is wired to the container during `container.init()`. Create it **before** calling `init()`; calling `use()` or `create()` before the container is initialized throws an error.

## Initial configuration

Set up the memory and Redis circuit-breaker adapters, create the container, then register the `CircuitBreakerFactoryResolver` and wrap it with `circuitBreakerFactoryResolverDiFactory`:

#### 1. Set up the memory circuit-breaker adapter

```ts file=./samples/memory-circuit-breaker-adapter.ts

```

#### 2. Set up the Redis circuit-breaker adapter

```ts file=./samples/redis-circuit-breaker-adapter.ts

```

#### 3. Create the dependency injection container

```ts file=./samples/container.ts

```

#### 4. Register and initialize the circuit-breaker factory resolver

```ts file=./samples/circuit-breaker-factory-resolver-di-factory.ts

```

## Usage

### 1. Using the default adapter

```ts file=./samples/circuit-breaker-factory-resolver-di-factory-default-adapter.ts

```

### 2. Specifying an adapter explicitly

```ts file=./samples/circuit-breaker-factory-resolver-di-factory-specific-adapter.ts

```

## Using it with the middlewares

Because the proxy implements `ICircuitBreakerFactoryResolver`, it can be passed straight to the [circuit-breaker middleware factories](../circuit_breaker_middlewares/index.md):

```ts file=./samples/circuit-breaker-factory-resolver-di-factory-with-middleware.ts

```

## Further information

For further information refer to [`eridu-tech/circuit-breaker`](https://eridu-tech.github.io/eridu-tech-core/modules/CircuitBreaker.html) API docs.
