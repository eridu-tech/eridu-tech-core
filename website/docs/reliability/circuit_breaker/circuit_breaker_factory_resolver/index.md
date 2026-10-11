---
sidebar_position: 2
sidebar_label: Resolver classes
pagination_label: CircuitBreaker resolver classes
tags:
    - CircuitBreaker
    - Resolvers
keywords:
    - CircuitBreaker
    - Resolvers
---

# CircuitBreaker provider resolver classes

## pro

The `CircuitBreakerFactoryResolver` class provides a flexible way to configure and switch between different circuit-breaker adapters at runtime.

### Initial configuration

To begin using the `CircuitBreakerFactoryResolver`, You will need to register all required adapters during initialization.

```ts file=./samples/circuit-breaker-factory-resolver-initial-config.ts

```

### Usage

#### 1. Using the default adapter

```ts file=./samples/circuit-breaker-factory-resolver-default-adapter.ts

```

:::danger
Note that if you dont set a default adapter, an error will be thrown.
:::

#### 2. Specifying an adapter explicitly

```ts file=./samples/circuit-breaker-factory-resolver-specific-adapter.ts

```

:::danger
Note that if you specify a non-existent adapter, an error will be thrown.
:::

## Further information

For further information refer to [`eridu-tech/circuit-breaker`](https://eridu-tech.github.io/eridu-tech-core/modules/CircuitBreaker.html) API docs.
