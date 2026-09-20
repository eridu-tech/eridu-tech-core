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

## Initial configuration

To begin using the transaction middlewares, you'll need to create and configure a `TransactionContext` instance:

```ts file=./samples/transaction-context.ts

```

## withTransactionFactory middleware

The transaction middleware intercepts function calls and runs them inside a transaction. When the wrapped function is invoked, the middleware delegates to `transactionContext.run()` with the requested propagation mode, so the wrapped function executes within a transaction scope — joining, starting, or forbidding one depending on the mode.

The propagation mode defaults to `REQUIRED`: the wrapped function joins an existing transaction when one is active and starts a new one otherwise.

### Usage

```ts file=./samples/with-transaction.ts

```

:::info
Here is a complete list of settings for the [`withTransactionFactory`](https://eridu-tech.github.io/eridu-tech-core/functions/TransactionContext.withTransactionFactory.html) function.
:::

## withAfterCommitFactory middleware

The after-commit middleware intercepts function calls and registers them to run once the active transaction commits. When the wrapped function is invoked, the middleware delegates to `transactionContext.afterCommit()`, so the wrapped function is registered as an after-commit invocable instead of running immediately. This is useful for side effects that must not happen when the transaction is rolled back, such as sending emails or publishing events.

When no transaction is active, the wrapped function runs immediately, unless `runIfNoTransaction` is `false`, in which case it is discarded.

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
