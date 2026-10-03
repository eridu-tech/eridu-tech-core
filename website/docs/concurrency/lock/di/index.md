---
sidebar_position: 7
sidebar_label: DI container
pagination_label: Lock DI container integration
tags:
    - Lock
    - DI
    - Dependency injection
keywords:
    - Lock
    - DI
    - Dependency injection
---

# DI Container Integration

The `lockFactoryResolverDiFactory` function creates an [`ILockFactoryResolver`](../lock_factory_resolver/index.md) whose underlying resolver is resolved from a [DI container](../../../foundation/di/index.md).

The returned proxy implements both `ILockFactoryResolver` and `ILockFactory`:

- `use(adapterName?)` selects an adapter on the resolved `LockFactoryResolver`.
- `create(key, settings?)` creates a lock through the resolver's default adapter.

The proxy is wired to the container during `container.init()`. Create it **before** calling `init()`; calling `use()` or `create()` before the container is initialized throws an error.

## Initial configuration

Register a `LockFactoryResolver` in the container and wrap it with `lockFactoryResolverDiFactory`:

```ts file=./samples/lock-factory-resolver-di-factory.ts

```

## Usage

### 1. Using the default adapter

```ts file=./samples/lock-factory-resolver-di-factory-default-adapter.ts

```

### 2. Specifying an adapter explicitly

```ts file=./samples/lock-factory-resolver-di-factory-specific-adapter.ts

```

## Using it with the middlewares

Because the proxy implements `ILockFactoryResolver`, it can be passed straight to the [lock middleware factories](../lock_middlewares/index.md):

```ts file=./samples/lock-factory-resolver-di-factory-with-middleware.ts

```

## Further information

For further information refer to [`eridu-tech/lock`](https://eridu-tech.github.io/eridu-tech-core/modules/Lock.html) API docs.
