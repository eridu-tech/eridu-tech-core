---
"eridu-tech": minor
---

Added an `eridu-tech/transaction-context/di` entrypoint that exports the directly constructible `ProxyTransactionContextResolver` class.

`ProxyTransactionContextResolver` implements `ITransactionHooks` and `ITransactionRunner`, and resolves the registered `TransactionContextResolver` from a dependency-injection container. The token is resolved once during `IContainer.init()`, after which `use()`, `run()`, and `afterCommit()` delegate to the real resolver.

```ts
import { TransactionContextResolver } from "eridu-tech/transaction-context";
import { ProxyTransactionContextResolver } from "eridu-tech/transaction-context/di";

const transactionContextResolver = new TransactionContextResolver({
    adapters: { primary: adapter },
    defaultAdapter: "primary",
    executionContext,
});
container.registerValue({
    token: TransactionContextResolver,
    value: transactionContextResolver,
});

// Create the proxy before container.init()
const transactionContext = new ProxyTransactionContextResolver(
    container,
    TransactionContextResolver,
);

await container.init();

await transactionContext.run(async () => {
    // delegates to the resolved TransactionContextResolver
});
```

### Notes

- Follows the same pattern as the other `Proxy*` classes exported from the `*/di` entrypoints (see `proxy-resolver-di-helpers`).
- Construct the proxy before `IContainer.init()`; calling `use()`, `run()`, or `afterCommit()` before `init()` is awaited throws.
