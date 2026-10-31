---
"eridu-tech": minor
---

Added an `eridu-tech/execution-context/di` entrypoint that exports the directly constructible `ProxyExecutionContext` class.

`ProxyExecutionContext` implements `IAsyncExecutionContext` and resolves the registered async execution context from a dependency-injection container. The `executionContextToken` is resolved through the container on every operation with `IServiceResolver.resolveOrFail`, so the proxy can be constructed at any point, and scoped registrations must be used inside `IContainer.run()`. Mutating methods return an `IAsyncContextChain` that reuses a single resolution, so chained mutations are applied to the same execution context.

```ts
import { genericToken } from "eridu-tech/di/contracts";
import { AsyncExecutionContext } from "eridu-tech/execution-context";
import { ProxyExecutionContext } from "eridu-tech/execution-context/di";

const executionContextToken =
    genericToken<IAsyncExecutionContext>("executionContext");

container.registerFactory({
    token: executionContextToken,
    factory: () => new AsyncExecutionContext(new AlsExecutionContextAdapter()),
    deps: {},
    lifetime: LIFETIME.SINGLETON,
});

export const executionContext = new ProxyExecutionContext({
    container,
    executionContextToken,
});
```
