---
sidebar_position: 1
sidebar_label: Usage
pagination_label: CircuitBreaker Usage
tags:
    - CircuitBreaker
    - Usage
keywords:
    - CircuitBreaker
    - Usage
---

# CircuitBreaker usage

The `eridu-tech/circuit-breaker` component provides a way for managing circuit-breaker independent of underlying platform or storage.

## Initial configuration

To begin using the `CircuitBreakerFactory` class, you'll need to create and configure an instance:

```ts file=./samples/circuit-breaker-initial-config.ts

```

:::info
Here is a complete list of settings for the [`CircuitBreakerFactory`](https://eridu-tech.github.io/eridu-tech-core/types/CircuitBreaker.CircuitBreakerFactorySettingsBase.html) class.
:::

## CircuitBreaker basics

### Creating a circuit-breaker

```ts file=./samples/circuit-breaker-create.ts

```

### Using the circuit-breaker

```ts file=./samples/circuit-breaker-run-or-fail.ts

```

:::info
Note the method throws an error when the circuit-breaker is in open state or isolated state.
:::

:::info
You can provide synchronous or asynchronous [`Invocable<[], TValue | Promise<TValue>>`](/docs/utilities/invocable/) as values for the `runOrFail` method.
:::

### Applying circuit-breaker on certiain errors

```ts file=./samples/circuit-breaker-error-policy.ts

```

### Setting circuit-breaker triggers

By default the the circuit-breaker will treat errors and slow calls as failures. You can explicitly set ths option.

The `CIRCUIT_BREAKER_TRIGGER.BOTH` will treat error and slow calls as failures.

```ts file=./samples/circuit-breaker-trigger-both.ts

```

The `CIRCUIT_BREAKER_TRIGGER.ONLY_ERROR` will treat only errors as failures.

```ts file=./samples/circuit-breaker-trigger-only-error.ts

```

The `CIRCUIT_BREAKER_TRIGGER.ONLY_SLOW_CALL` will treat slow calls as failures.

```ts file=./samples/circuit-breaker-trigger-only-slow-call.ts

```

### Setting the slow call threshold

You can set custom slow call threshold that will be used when treating slow calls as failures.

```ts file=./samples/circuit-breaker-slow-call-threshold.ts

```

### Reseting the circuit-breaker

You can reset circuit-breaker state to the closed state manually.

```ts file=./samples/circuit-breaker-reset.ts

```

### Isolating the circuit-breaker

You can manually hold circuit-breaker in open state until reseted.

```ts file=./samples/circuit-breaker-isolate.ts

```

### Checking circuit-breaker state

You can get the circuit-breaker state by using the `getState` method, it returns [`CircuitBreakerState`](https://eridu-tech.github.io/eridu-tech-core/types/CircuitBreaker.CircuitBreakerState.html).

```ts file=./samples/circuit-breaker-get-state.ts

```

### CircuitBreaker instance variables

The `CircuitBreaker` class exposes instance variables such as:

```ts file=./samples/circuit-breaker-instance-variables.ts

```

## Patterns

### Serialization and deserialization of circuit-breakers

circuit-breakers can be serialized, allowing them to be transmitted over the network to another server and later deserialized for reuse.
This means you can, for example, acquire the circuit-breaker on the main server, transfer it to a queue worker server, and release it there.
In order to serialize or deserialize a circuit-breaker you need pass an object that implements [`ISerderRegister`](/docs/components/serde) contract like the [`Serde`](/docs/components/serde) class to `CircuitBreakerFactory`.

Manually serializing and deserializing the circuit-breaker:

```ts file=./samples/circuit-breaker-manual-serialization.ts

```

:::danger
When serializing or deserializing a circuit-breaker, you must use the same `Serde` instances that were provided to the `CircuitBreakerFactory`. This is required because the `CircuitBreakerFactory` injects custom serialization logic for `ICircuitBreaker` instance into `Serde` instances.
:::

:::info
Note you only need manuall serialization and deserialization when integrating with external libraries.
:::

As long you pass the same `Serde` instances with all other components you dont need to serialize and deserialize the circuit-breaker manually.

```ts file=./samples/circuit-breaker-event-bus-serialization.ts

```

## Further information

For further information refer to [`eridu-tech/circuit-breaker`](https://eridu-tech.github.io/eridu-tech-core/modules/CircuitBreaker.html) API docs.
