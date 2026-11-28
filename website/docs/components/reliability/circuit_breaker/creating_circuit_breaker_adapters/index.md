---
sidebar_position: 5
sidebar_label: Creating adapters
pagination_label: Creating CircuitBreaker adapters
tags:
    - CircuitBreaker
    - Creating adapters
keywords:
    - CircuitBreaker
    - Creating adapters
---

# Creating CircuitBreaker adapters

## Implementing your custom ICircuitBreakerAdapter

In order to create an adapter you need to implement the [`ICircuitBreakerAdapter`](https://eridu-tech.github.io/eridu-tech-core/types/CircuitBreaker.ICircuitBreakerAdapter.html) contract.

Every adapter owns its own persistence. There is no storage-adapter plug-in point: an adapter that needs external storage creates its schema in `init()` and removes it in `deInit()`, and applies the `backoffPolicy` and `circuitBreakerPolicy` settings internally.

```ts file=./samples/custom-circuit-breaker-adapter.ts

```

## Implementing your custom circuit-breaker factory class

In some cases, you may need to implement a custom [`CircuitBreakerFactory`](https://eridu-tech.github.io/eridu-tech-core/classes/CircuitBreaker.CircuitBreakerFactory.html) class to optimize performance for your specific technology stack. You can then directly implement the [`ICircuitBreakerFactory`](https://eridu-tech.github.io/eridu-tech-core/types/CircuitBreaker.ICircuitBreakerFactory.html) contract.

## Further information

For further information refer to [`eridu-tech/circuit-breaker`](https://eridu-tech.github.io/eridu-tech-core/modules/CircuitBreaker.html) API docs.
