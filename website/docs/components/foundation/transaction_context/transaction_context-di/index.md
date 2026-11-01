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

Set up the MongoDB and SQLite databases and transaction adapters. Create the container, register the MongoDB adapter as primary (default) and the SQLite adapter as secondary, initialize the resolver from its `onInit` hook, and wrap it with `ProxyTransactionContextResolver`:

#### 1. Set up the MongoDB database

```ts file=./samples/mongodb-database.ts

```

#### 2. Create the MongoDB transaction adapter

```ts file=./samples/mongodb-transaction-adapter.ts

```

#### 3. Set up the SQLite database

```ts file=./samples/sqlite-database.ts

```

#### 4. Create the SQLite transaction adapter

```ts file=./samples/sqlite-transaction-adapter.ts

```

#### 5. Create the dependency injection container

```ts file=./samples/container.ts

```

#### 6. Register and initialize the transaction context resolver

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
