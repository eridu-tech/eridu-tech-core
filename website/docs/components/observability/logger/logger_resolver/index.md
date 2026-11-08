---
sidebar_position: 2
sidebar_label: Resolver classes
pagination_label: Logger resolver classes
tags:
    - Logger
    - Resolvers
keywords:
    - Logger
    - Resolvers
---

# LoggerResolver

The `LoggerResolver` class provides a flexible way to configure and switch between different logger transports at runtime.

## Initial configuration

To begin using the `LoggerResolver`, you will need to register all required transports during initialization.

```ts file=./samples/logger-resolver-initial-config.ts

```

:::info
Here is a complete list of settings for the [`LoggerResolver`](https://eridu-tech.github.io/eridu-tech-core/types/Observability.LoggerResolverSettings.html) class.
:::

## Usage

### 1. Using the default transport

```ts file=./samples/logger-resolver-default-transport.ts

```

:::danger
Note that if you don't set a default transport, an error will be thrown.
:::

### 2. Specifying a transport explicitly

```ts file=./samples/logger-resolver-specific-transport.ts

```

:::danger
Note that if you specify a non-existent transport, an error will be thrown.
:::

## Further information

For further information refer to [`eridu-tech/logger`](https://eridu-tech.github.io/eridu-tech-core/modules/Observability.html) API docs.
