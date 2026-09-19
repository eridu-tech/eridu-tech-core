---
sidebar_position: 1
sidebar_label: Usage
pagination_label: TransactionContext usage
tags:
    - TransactionContext
    - Usage
    - Propagation
    - Transactions
keywords:
    - TransactionContext
    - Usage
    - Propagation
    - Transactions
---

# TransactionContext usage

The `eridu-tech/transaction-context` component lets you run code inside a database transaction and access the client that belongs to the current transaction scope, without passing it around manually.

## Initial configuration

To begin using the `TransactionContext` class, you'll need to create and configure an instance:

```ts file=./samples/transaction-context-initial-config.ts

```

:::info
Here is a complete list of settings for the [`TransactionContext`](https://eridu-tech.github.io/eridu-tech-core/types/TransactionContext.ITransactionContextSettings.html) class.
:::

## Transaction basics

### Running code in a transaction

You can run an invocable inside a transaction scope with `run()`. When no transaction is active a new one is started, committed after the invocable succeeds, and the invocable's return value is returned:

```ts file=./samples/transaction-context-run.ts

```

### Aborting a transaction

When the invocable throws, the transaction is aborted and the original error is re-thrown:

```ts file=./samples/transaction-context-abort.ts

```

### Inspecting the connection state

A transaction context exposes four read-only members describing the current scope, plus a fail-fast accessor for the transaction client. None of them performs I/O, so they are safe to read anywhere.

#### `client`

The base client that operates outside of any transaction. It comes straight from the adapter and never becomes transaction-scoped, so it is the same instance inside and outside a transaction.

Use it only for work that must stay **outside** the ambient transaction:

- schema and migration work,
- a repository that opts out of the caller's transaction.

```ts file=./samples/transaction-context-client.ts

```

:::warning
Never use the base client for work that belongs to the transaction. It runs on a different connection than the open transaction, which means the work silently escapes the transaction and the two connections can deadlock against each other.
:::

#### `transaction`

The active transaction-scoped client, or `null` when there is none.

Use it to get the transaction client explicitly and to handle the absence yourself. It never throws, so a `null` check is required; for the opposite behaviour use `getTransactionOrFail()`.

The value is scoped to the current call chain and to this context's `token`, so another `TransactionContext` with a different token sees `null` even while a transaction is active here.

```ts file=./samples/transaction-context-transaction.ts

```

#### `current`

The client for the current scope: the transaction-scoped client when a transaction is active, otherwise the base client. It is never `null`.

Prefer it in application and repository code, so that code takes part in the caller's transaction when there is one and falls back to the base client when there is none.

```ts file=./samples/transaction-context-current.ts

```

:::info
`current` is typed as `TClient | TTransactionClient`, so what it can do depends on the two type parameters.

When they are the same, as with `KyselyTransactionAdapter`, `current` is fully usable. When they differ, as with `MongodbTransactionAdapter` (an `ITransactionAdapter<Db, ClientSession>`), only the members shared by both types are callable, so a MongoDB driver call cannot be made through `current`.

In that case, read the `transaction` getter to obtain the `ClientSession` and pass it to the collection settings as `{ session }`.
:::

#### `isInTransaction`

Whether a transaction is active in this context. Derived from `transaction`, so it is cheap to call anywhere.

Use it to decide, not to do: defer a side effect through `afterCommit()` or run it right away, guard transactional-only code, or narrow `current` when the two client types differ. It is always `false` for `TransactionContext.noOp()`.

```ts file=./samples/transaction-context-is-in-transaction.ts

```

#### `getTransactionOrFail()`

Returns the active transaction-scoped client, and throws a `MandatoryPropagationError` when no transaction is active. Calling it opts the surrounding code into `MANDATORY` propagation, which is the fail-fast counterpart of checking `transaction` for `null` yourself.

```ts file=./samples/transaction-context-get-transaction-or-fail.ts

```

In short: `client` opts out of the transaction, `current` opts in, `transaction` and `getTransactionOrFail()` require it, and `isInTransaction` asks whether there is one.

### Nesting runs

Nested `run()` calls reuse the transaction that is already active instead of starting a new one, so a single transaction spans the whole call chain:

```ts file=./samples/transaction-context-nested-run.ts

```

## Patterns

### Propagation modes

`run()` accepts a propagation mode that decides how it behaves in relation to an existing transaction:

| Mode        | Transaction is active          | No transaction is active           |
| ----------- | ------------------------------ | ---------------------------------- |
| `REQUIRED`  | Joins the existing transaction | Starts a new transaction           |
| `SUPPORTS`  | Joins the existing transaction | Runs without a transaction         |
| `MANDATORY` | Joins the existing transaction | Throws `MandatoryPropagationError` |
| `NEVER`     | Throws `NeverPropagationError` | Runs without a transaction         |

`REQUIRED` is the default when no propagation mode is provided:

```ts file=./samples/transaction-context-propagation.ts

```

:::info
Here is a complete list of propagation modes for the [`TRANSACTION_PROPAGATION`](https://eridu-tech.github.io/eridu-tech-core/variables/TransactionContext.TRANSACTION_PROPAGATION.html) constant.
:::

### After commit hooks

You can register an invocable that only runs once the active transaction commits. This is useful for side effects that must not happen when the transaction is rolled back, such as sending emails or publishing events:

```ts file=./samples/transaction-context-after-commit.ts

```

Hooks are attached to the transaction scope they were registered in, so they are discarded when that transaction aborts. When several hooks are registered, they run in registration order.

### Hooks without a transaction

When no transaction is active, `afterCommit()` decides what to do based on the `runIfNoTransaction` setting:

```ts file=./samples/transaction-context-after-commit-no-transaction.ts

```

### Non-transactional contexts

You can create a context that never uses transactions with `TransactionContext.noOp()`. This is useful when a component expects a transaction context, but the underlying storage cannot support transactions:

```ts file=./samples/transaction-context-no-op.ts

```

:::info
With a no-op context, `run()` invokes its invocable directly, `isInTransaction` is always `false`, `transaction` is always `null`, and `getTransactionOrFail()` always throws a `MandatoryPropagationError`.
:::

### Multiple databases

You can fan out after-commit hooks to several transaction contexts with `MultiTransactionHooks`, so a single consumer stays transaction-aware across every database a project uses, for example PostgreSQL and SQLite at the same time:

```ts file=./samples/multi-transaction-hooks.ts

```

:::info
The hook is registered on every wrapped context that currently has an active transaction, and therefore runs once per transaction that commits. When none of the wrapped contexts is in a transaction, the hook runs immediately unless `runIfNoTransaction` is `false`.
:::

## Further information

For further information refer to [`eridu-tech/transaction-context`](https://eridu-tech.github.io/eridu-tech-core/modules/TransactionContext.html) API docs.
