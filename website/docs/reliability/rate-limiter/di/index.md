---
sidebar_position: 9
sidebar_label: DI container
pagination_label: RateLimiter DI container integration
tags:
    - RateLimiter
    - DI
    - Dependency injection
keywords:
    - RateLimiter
    - DI
    - Dependency injection
---

# DI Container Integration

The `rateLimiterFactoryResolverDiFactory` function creates an [`IRateLimiterFactoryResolver`](../rate_limiter_factory_resolver/index.md) whose underlying resolver is resolved from a [DI container](../../../foundation/di/index.md).

The returned proxy implements both `IRateLimiterFactoryResolver` and `IRateLimiterFactory`:

- `use(adapterName?)` selects an adapter on the resolved `RateLimiterFactoryResolver`.
- `create(key, settings)` creates a rate limiter through the resolver's default adapter.

The proxy is wired to the container during `container.init()`. Create it **before** calling `init()`; calling `use()` or `create()` before the container is initialized throws an error.

## Initial configuration

Register a `RateLimiterFactoryResolver` in the container and wrap it with `rateLimiterFactoryResolverDiFactory`:

```ts file=./samples/rate-limiter-factory-resolver-di-factory.ts

```

## Usage

### 1. Using the default adapter

```ts file=./samples/rate-limiter-factory-resolver-di-factory-default-adapter.ts

```

### 2. Specifying an adapter explicitly

```ts file=./samples/rate-limiter-factory-resolver-di-factory-specific-adapter.ts

```

## Using it with the middlewares

Because the proxy implements `IRateLimiterFactoryResolver`, it can be passed straight to the [rate-limiter middleware factories](../rate_limiter_middlewares/index.md):

```ts file=./samples/rate-limiter-factory-resolver-di-factory-with-middleware.ts

```

## Further information

For further information refer to [`eridu-tech/rate-limiter`](https://eridu-tech.github.io/eridu-tech-core/modules/RateLimiter.html) API docs.
