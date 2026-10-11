---
sidebar_position: 6
sidebar_label: DI integration
pagination_label: Transaction-context DI container integration
tags:
    - TransactionContext
    - DI
    - Dependency injection
keywords:
    - TransactionContext
    - DI
    - Dependency injection
---

# DI Integration

The `ProxyTransactionContextResolver` class provides an [`ITransactionContextResolver`](../transaction_context_resolver/index.md) whose underlying resolver is resolved from a [DI container](../../di/index.md).

The proxy supports the `ITransactionContextResolver` operations:

- `use(adapterName?)` returns a transaction runner that resolves the resolver from the container for each operation.
- `run(...)` delegates to the default adapter's transaction runner.
- `afterCommit(asyncInvocable, settings?)` resolves the resolver from the container and delegates to it.

The proxy resolves the resolver lazily, so it supports the container's configured lifetimes. Scoped registrations must be used inside `container.run()`. Initialize the resolver from the container before using it.

## Initial configuration

Register the `TransactionContextResolver` in the container, initialize it from its `onInit` hook, and wrap it with `ProxyTransactionContextResolver`:

```ts file=./samples/transaction-context-resolver-di.ts

```

## Usage

### 1. Using the default adapter

```ts file=./samples/transaction-context-resolver-di-default-adapter.ts

```

### 2. Specifying an adapter explicitly

```ts file=./samples/transaction-context-resolver-di-specific-adapter.ts

```

## Further information

For further information refer to [`eridu-tech/transaction-context`](https://eridu-tech.github.io/eridu-tech-core/modules/TransactionContext.html) API docs.
