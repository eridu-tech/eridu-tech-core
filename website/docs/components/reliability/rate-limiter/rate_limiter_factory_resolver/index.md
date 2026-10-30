---
sidebar_position: 2
sidebar_label: Resolver classes
pagination_label: RateLimiter resolver classes
tags:
    - RateLimiter
    - Resolvers
keywords:
    - RateLimiter
    - Resolvers
---

# RateLimiter resolver factory classes

## RateLimiterFactoryResolver

The `RateLimiterFactoryResolver` class provides a flexible way to configure and switch between different rate-limiter adapters at runtime.

### Initial configuration

To begin using the `RateLimiterFactoryResolver`, You will need to register all required adapters during initialization.

```ts file=./samples/rate-limiter-factory-resolver-initial-config.ts

```

### Usage

#### 1. Using the default adapter

```ts file=./samples/rate-limiter-factory-resolver-default-adapter.ts

```

:::danger
Note that if you dont set a default adapter, an error will be thrown.
:::

#### 2. Specifying an adapter explicitly

```ts file=./samples/rate-limiter-factory-resolver-specific-adapter.ts

```

:::danger
Note that if you specify a non-existent adapter, an error will be thrown.
:::

## Further information

For further information refer to [`eridu-tech/rate-limiter`](https://eridu-tech.github.io/eridu-tech-core/modules/RateLimiter.html) API docs.
