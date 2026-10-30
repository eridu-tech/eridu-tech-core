---
sidebar_position: 2
sidebar_label: Resolver classes
pagination_label: Cache resolver classes
tags:
    - Cache
    - Resolvers
keywords:
    - Cache
    - Resolvers
---

# CacheResolver

The `CacheResolver` class provides a flexible way to configure and switch between different cache adapters at runtime.

## Initial configuration

To begin using the `CacheResolver`, you will need to register all required adapters during initialization.

```ts file=./samples/cache-resolver-initial-config.ts

```

## Usage

### 1. Using the default adapter

```ts file=./samples/cache-resolver-default-adapter.ts

```

:::danger
Note that if you dont set a default adapter, an error will be thrown.
:::

### 2. Specifying an adapter explicitly

```ts file=./samples/cache-resolver-specific-adapter.ts

```

:::danger
Note that if you specify a non-existent adapter, an error will be thrown.
:::

## Further information

For further information refer to [`eridu-tech/cache`](https://eridu-tech.github.io/eridu-tech-core/modules/Cache.html) API docs.
