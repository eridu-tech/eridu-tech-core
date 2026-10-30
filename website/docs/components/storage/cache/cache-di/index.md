---
sidebar_position: 7
sidebar_label: DI integration
pagination_label: Cache DI container integration
tags:
    - Cache
    - DI
    - Dependency injection
keywords:
    - Cache
    - DI
    - Dependency injection
---

# DI Integration

The `cacheResolverDiFactory` function creates an [`ICacheResolver`](../cache_resolver/index.md) whose underlying resolver is resolved from a [DI container](../../../foundation/di/index.md).

The returned proxy implements both `ICacheResolver` and `ICache`:

- `use(adapterName?)` selects an adapter on the resolved `CacheResolver`.
- The `ICache` methods such as `get`, `add` and `getOrAdd` delegate to the resolver's default adapter.

The proxy is wired to the container during `container.init()`. Create it **before** calling `init()`; calling `use()` or a cache method before the container is initialized throws an error.

## Initial configuration

Set up the memory and Redis cache adapters, create the container, then register the `CacheResolver` and wrap it with `cacheResolverDiFactory`:

#### 1. Set up the memory cache adapter

```ts file=./samples/memory-cache-adapter.ts

```

#### 2. Set up the Redis cache adapter

```ts file=./samples/redis-cache-adapter.ts

```

#### 3. Create the dependency injection container

```ts file=./samples/container.ts

```

#### 4. Register and initialize the cache resolver

```ts file=./samples/cache-resolver-di-factory.ts

```

## Usage

### 1. Using the default adapter

```ts file=./samples/cache-resolver-di-factory-default-adapter.ts

```

### 2. Specifying an adapter explicitly

```ts file=./samples/cache-resolver-di-factory-specific-adapter.ts

```

## Using it with the middlewares

Because the proxy implements `ICacheResolver`, it can be passed straight to the [cache middleware factories](../cache_middlewares/index.md):

```ts file=./samples/cache-resolver-di-factory-with-middleware.ts

```

## Further information

For further information refer to [`eridu-tech/cache`](https://eridu-tech.github.io/eridu-tech-core/modules/Cache.html) API docs.
