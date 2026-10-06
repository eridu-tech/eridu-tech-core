---
"eridu-tech": minor
---

Added `TransactionContextResolver` for dynamically selecting between registered transaction adapters.

`TransactionContextResolver` registers named transaction adapters and resolves one into an `ITransactionRunner` through `use(adapterName?)`. Because `ITransactionContextResolver` extends `ITransactionHooks`, the returned runner exposes `run()` while the resolver itself exposes `afterCommit()`.

```ts
import { TransactionContextResolver } from "eridu-tech/transaction-context";

const transactionContextResolver = new TransactionContextResolver({
    adapters: { primary: adapter },
    defaultAdapter: "primary",
    executionContext,
});

await transactionContextResolver.use().run(async () => {
    // ...
});
```

- `use(adapterName?)` resolves the named adapter to an `ITransactionRunner`, defaulting to `defaultAdapter`. It throws `DefaultAdapterNotDefinedError` when no name is given and no default is configured, and `UnregisteredAdapterError` for an unknown name.
- `eridu-tech/transaction-context` exports `TransactionContextResolver` and `TransactionContextResolverSettings`, and `eridu-tech/transaction-context/contracts` exports the `ITransactionContextResolver` contract.

Reworked the `withTransactionFactory` middleware to the same resolver-based pattern as the other middleware factories:

- `withTransactionFactory(transactionContextResolver)` now takes a `RunTransactionResolver` (a narrowed form of `ITransactionContextResolver`) and returns a `WithTransaction` that is also a `WithTransactionResolver`.
- Calling the returned factory uses the resolver's default adapter; `withTransaction.use("adapter")` runs the wrapped function through a specific registered adapter.
- The propagation mode moved into a `WithTransactionSettings` object and still defaults to `TRANSACTION_PROPAGATION.REQUIRED`.
- `eridu-tech/transaction-context/middlewares` exports `RunTransactionResolver`, `WithTransaction`, `WithTransactionSettings` and `WithTransactionResolver`.

```ts
import { withTransactionFactory } from "eridu-tech/transaction-context/middlewares";

const withTransaction = withTransactionFactory(transactionContextResolver);

const createUserInTransaction = use(createUser, withTransaction());

const createUserInExistingTransaction = use(
    createUser,
    withTransaction({ propagation: TRANSACTION_PROPAGATION.MANDATORY }),
);

const createUserOnPrimary = use(createUser, withTransaction.use("primary")());
```

### Breaking changes

- `withTransactionFactory` now takes a transaction context resolver instead of a single transaction context, and returns a callable middleware factory with an additional `use(adapter?)` method.
- The propagation mode is passed in a settings object — `withTransaction({ propagation })` — instead of as the factory's positional argument. `withTransaction(TRANSACTION_PROPAGATION.MANDATORY)` no longer compiles.

### Notes

- The `eridu-tech/transaction-context/di` entrypoint exports `ProxyTransactionContextResolver`, which wraps this resolver, resolves it lazily through the container, and supports every lifetime (see `transaction-context-di-proxy`).
- `MultiTransactionHooks` (`transaction-context/implementations/derivables/multi-transaction-hooks`) is internal: it is marked `@internal`, is not exported from any public entrypoint, and is therefore excluded from the generated API documentation. It backs `TransactionContextResolver.afterCommit()` by forwarding a registered hook to every registered adapter that currently has an active transaction.
