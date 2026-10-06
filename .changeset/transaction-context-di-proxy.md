---
"eridu-tech": minor
---

Added an `eridu-tech/transaction-context/di` entrypoint that exports the directly constructible `ProxyTransactionContextResolver` class.

`ProxyTransactionContextResolver` implements `ITransactionContextResolver` and resolves the registered `TransactionContextResolver` from a dependency-injection container. The `resolverToken` is resolved through the container on every operation with `IServiceResolver.resolveOrFail`, so the proxy can be constructed at any point and every lifetime is supported: singleton and transient registrations can be used once `IContainer.init()` has been awaited, while scoped registrations are resolved per operation and must be used inside `IContainer.run()`.

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

const transactionContext = new ProxyTransactionContextResolver({
    container,
    resolverToken: TransactionContextResolver,
});

await container.init();

await transactionContext.run(async () => {
    // delegates to the resolved TransactionContextResolver
});
```

`run()` and `afterCommit()` resolve the registered resolver and delegate to it. `use(adapterName?)` returns a lightweight `ITransactionRunner` whose `run()` resolves the registered resolver the first time it is invoked.

### Notes

- Configure the proxy with a `ProxyTransactionContextResolverSettings` object (`container` and `resolverToken`).
- Follows the same pattern as the other `Proxy*` classes exported from the `*/di` entrypoints (see `proxy-resolver-di-helpers`).
