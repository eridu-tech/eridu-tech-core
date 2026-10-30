---
sidebar_position: 5
sidebar_label: Resolver classes
pagination_label: Transaction-context resolver classes
tags:
    - TransactionContext
    - Resolvers
keywords:
    - TransactionContext
    - Resolvers
---

# TransactionContextResolver

The `TransactionContextResolver` creates a transaction context for each configured adapter. Use it to run work with a default transaction adapter or select a specific adapter at runtime.

## Initial configuration

Set up the SQLite and MongoDB databases and their transaction adapters, then register them with the resolver and call `init()`. Initialization creates a transaction context for each configured adapter.

#### 1. Set up the SQLite database

```ts file=./samples/sqlite-database.ts

```

#### 2. Create the SQLite transaction adapter

```ts file=./samples/sqlite-transaction-adapter.ts

```

#### 3. Set up the MongoDB database

```ts file=./samples/mongodb-database.ts

```

#### 4. Create the MongoDB transaction adapter

```ts file=./samples/mongodb-transaction-adapter.ts

```

#### 5. Configure the transaction context resolver

```ts file=./samples/transaction-context-resolver-initial-config.ts

```

## Usage

### 1. Using the default adapter

```ts file=./samples/transaction-context-resolver-default-adapter.ts

```

:::danger
If no default adapter is configured and none is specified in `use()`, an error is thrown.
:::

### 2. Specifying an adapter explicitly

```ts file=./samples/transaction-context-resolver-specific-adapter.ts

```

:::danger
If you specify an adapter that is not configured, an error is thrown. Call `init()` before `use()`; otherwise, no configured adapter is available yet.
:::

### Registering after-commit hooks

The resolver's `afterCommit()` registers a callback with the configured transaction contexts. If none has an active transaction, the callback runs immediately by default. Otherwise, it is scheduled with each active transaction context and runs after that context commits. Use `runIfNoTransaction: false` to discard the callback when no transaction is active.

## Further information

For further information refer to [`eridu-tech/transaction-context`](https://eridu-tech.github.io/eridu-tech-core/modules/TransactionContext.html) API docs.
