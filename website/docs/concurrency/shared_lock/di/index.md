---
sidebar_position: 7
sidebar_label: DI container
pagination_label: SharedLock DI container integration
tags:
    - SharedLock
    - DI
    - Dependency injection
keywords:
    - SharedLock
    - DI
    - Dependency injection
---

# DI Container Integration

The `sharedLockFactoryResolverDiFactory` function creates an [`ISharedLockFactoryResolver`](../shared_lock_factory_resolver/index.md) whose underlying resolver is resolved from a [DI container](../../../foundation/di/index.md).

The returned proxy implements both `ISharedLockFactoryResolver` and `ISharedLockFactory`:

- `use(adapterName?)` selects an adapter on the resolved `SharedLockFactoryResolver`.
- `create(key, settings)` creates a shared lock through the resolver's default adapter.

The proxy is wired to the container during `container.init()`. Create it **before** calling `init()`; calling `use()` or `create()` before the container is initialized throws an error.

## Initial configuration

Register a `SharedLockFactoryResolver` in the container and wrap it with `sharedLockFactoryResolverDiFactory`:

```ts file=./samples/shared-lock-factory-resolver-di-factory.ts

```

## Usage

### 1. Using the default adapter

```ts file=./samples/shared-lock-factory-resolver-di-factory-default-adapter.ts

```

### 2. Specifying an adapter explicitly

```ts file=./samples/shared-lock-factory-resolver-di-factory-specific-adapter.ts

```

## Using it with the middlewares

Because the proxy implements `ISharedLockFactoryResolver`, it can be passed straight to the [shared-lock middleware factories](../shared_lock_middlewares/index.md):

```ts file=./samples/shared-lock-factory-resolver-di-factory-with-middleware.ts

```

## Further information

For further information refer to [`eridu-tech/shared-lock`](https://eridu-tech.github.io/eridu-tech-core/modules/SharedLock.html) API docs.
