---
sidebar_position: 2
sidebar_label: Resolver classes
pagination_label: FileStorage resolver classes
tags:
    - FileStorage
    - Resolvers
keywords:
    - FileStorage
    - Resolvers
---

# FileStorageResolver

The `FileStorageResolver` class provides a flexible way to configure and switch between different FileStorage adapters at runtime.

## Initial configuration

To begin using the `IFileStorageFactory`, You will need to register all required adapters during initialization.

```ts file=./samples/file-storage-resolver-initial-config.ts

```

## Usage

### 1. Using the default adapter

```ts file=./samples/file-storage-resolver-default-adapter.ts

```

:::danger
Note that if you dont set a default adapter, an error will be thrown.
:::

### 2. Specifying an adapter explicitly

```ts file=./samples/file-storage-resolver-specific-adapter.ts

```

:::danger
Note that if you specify a non-existent adapter, an error will be thrown.
:::

### 3. Overriding default settings

```ts file=./samples/file-storage-resolver-override-settings.ts

```

:::info
Note that the `FileStorageResolver` is immutable, meaning any configuration override returns a new instance rather than modifying the existing one.
:::

## Further information

For further information refer to [`eridu-tech/file-storage`](https://eridu-tech.github.io/eridu-tech-core/modules/file-storage.html) API docs.
