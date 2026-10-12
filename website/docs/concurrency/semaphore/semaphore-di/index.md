---
sidebar_position: 7
sidebar_label: DI integration
pagination_label: Semaphore DI container integration
tags:
    - Semaphore
    - DI
    - Dependency injection
keywords:
    - Semaphore
    - DI
    - Dependency injection
---

# DI Integration

The `semaphoreFactoryResolverDiFactory` function creates an [`ISemaphoreFactoryResolver`](../semaphore_factory_resolver/index.md) whose underlying resolver is resolved from a [DI container](../../../foundation/di/index.md).

The returned proxy implements both `ISemaphoreFactoryResolver` and `ISemaphoreFactory`:

- `use(adapterName?)` selects an adapter on the resolved `SemaphoreFactoryResolver`.
- `create(key, settings)` creates a semaphore through the resolver's default adapter.

The proxy is wired to the container during `container.init()`. Create it **before** calling `init()`; calling `use()` or `create()` before the container is initialized throws an error.

## Initial configuration

Set up the memory and Redis semaphore adapters, create the container, then register the `SemaphoreFactoryResolver` and wrap it with `semaphoreFactoryResolverDiFactory`:

#### 1. Set up the memory semaphore adapter

```ts file=./samples/memory-semaphore-adapter.ts

```

#### 2. Set up the Redis semaphore adapter

```ts file=./samples/redis-semaphore-adapter.ts

```

#### 3. Create the dependency injection container

```ts file=./samples/container.ts

```

#### 4. Register and initialize the semaphore factory resolver

```ts file=./samples/semaphore-factory-resolver-di-factory.ts

```

## Usage

### 1. Using the default adapter

```ts file=./samples/semaphore-factory-resolver-di-factory-default-adapter.ts

```

### 2. Specifying an adapter explicitly

```ts file=./samples/semaphore-factory-resolver-di-factory-specific-adapter.ts

```

## Using it with the middlewares

Because the proxy implements `ISemaphoreFactoryResolver`, it can be passed straight to the [semaphore middleware factories](../semaphore_middlewares/index.md):

```ts file=./samples/semaphore-factory-resolver-di-factory-with-middleware.ts

```

## Further information

For further information refer to [`eridu-tech/semaphore`](https://eridu-tech.github.io/eridu-tech-core/modules/Semaphore.html) API docs.
