---
sidebar_position: 6
sidebar_label: DI integration
pagination_label: FileStorage DI container integration
tags:
    - FileStorage
    - DI
    - Dependency injection
keywords:
    - FileStorage
    - DI
    - Dependency injection
---

# DI Integration

The `fileStorageResolverDiFactory` function creates an [`IFileStorageResolver`](../file_storage_resolver/index.md) whose underlying resolver is resolved from a [DI container](../../../foundation/di/index.md).

The returned proxy implements both `IFileStorageResolver` and `IFileStorage`:

- `use(adapterName?)` selects an adapter on the resolved `FileStorageResolver`.
- `create(key)` creates a file through the resolver's default adapter; `clear()` and `removeMany()` delegate as well.

The proxy is wired to the container during `container.init()`. Create it **before** calling `init()`; calling `use()` or `create()` before the container is initialized throws an error.

## Initial configuration

Register a `FileStorageResolver` in the container and wrap it with `fileStorageResolverDiFactory`:

```ts file=./samples/file-storage-resolver-di-factory.ts

```

## Usage

### 1. Using the default adapter

```ts file=./samples/file-storage-resolver-di-factory-default-adapter.ts

```

### 2. Specifying an adapter explicitly

```ts file=./samples/file-storage-resolver-di-factory-specific-adapter.ts

```

## Further information

For further information refer to [`eridu-tech/file-storage`](https://eridu-tech.github.io/eridu-tech-core/modules/FileStorage.html) API docs.
