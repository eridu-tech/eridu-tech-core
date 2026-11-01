---
sidebar_position: 4
sidebar_label: Middlewares
pagination_label: TransactionContext middlewares
tags:
    - TransactionContext
    - Middlewares
    - AOP
keywords:
    - TransactionContext
    - Middlewares
    - AOP
    - withTransaction
    - withAfterCommit
---

# TransactionContext middlewares

Transaction-context middlewares wrap functions to run them within a transaction or defer them until a transaction commits. They let you apply transaction behavior without adding it to the function implementation.

## Initial configuration

Set up the MongoDB and SQLite databases and their transaction adapters, then register them with the resolver and call `init()`. MongoDB is registered as the primary (default) adapter, while SQLite is registered as the secondary adapter:

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

#### 5. Configure the transaction context resolver

```ts file=./samples/transaction-context.ts

```

## withTransactionFactory middleware {#with_transaction_factory_middleware}

The transaction middleware intercepts function calls and runs them inside a transaction. When the wrapped function is invoked, the middleware delegates to the selected transaction context's `run()` method with the requested propagation mode, so the wrapped function executes within a transaction scope — joining, starting, or forbidding one depending on the mode.

The propagation mode defaults to `REQUIRED`: the wrapped function joins an existing transaction when one is active and starts a new one otherwise.

### Usage

```ts file=./samples/with-transaction.ts

```

Calling `withTransaction()` uses the transaction resolver's default adapter (`primary` in this example). Use `withTransaction.use("secondary")()` to run the wrapped function through a specific registered adapter.

:::info
Here is a complete list of settings for the [`withTransactionFactory`](https://eridu-tech.github.io/eridu-tech-core/functions/TransactionContext.withTransactionFactory.html) function.
:::

## withAfterCommitFactory middleware {#with_after_commit_factory_middleware}

The after-commit middleware intercepts function calls and registers them to run once the active transaction commits. When the wrapped function is invoked, the middleware delegates to `transactionContext.afterCommit()`, so the wrapped function is registered as an after-commit invocable instead of running immediately. This is useful for side effects that must not happen when the transaction is rolled back, such as sending emails or publishing events.

When no transaction is active, the wrapped function runs immediately, unless `runIfNoTransaction` is `false`, in which case it is discarded.

When using a `TransactionContextResolver`, `afterCommit` can be called within a transaction started by any configured adapter, for example `resolver.use("primary").run(callback)` or `resolver.use("secondary").run(callback)`. The hook runs after the active transaction commits.

### Usage

```ts file=./samples/with-after-commit.ts

```

:::info
Here is a complete list of settings for the [`withAfterCommitFactory`](https://eridu-tech.github.io/eridu-tech-core/functions/TransactionContext.withAfterCommitFactory.html) function.
:::

### Settings

| Option               | Type      | Default | Description                                                                                                      |
| -------------------- | --------- | ------- | ---------------------------------------------------------------------------------------------------------------- |
| `runIfNoTransaction` | `boolean` | `true`  | Whether to invoke the wrapped function immediately when there is no active transaction, instead of discarding it |

## Further information

For further information refer to [`eridu-tech/transaction-context`](https://eridu-tech.github.io/eridu-tech-core/modules/TransactionContext.html) API docs.
