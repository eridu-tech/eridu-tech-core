---
"eridu-tech": minor
---

Added an `eridu-tech/execution-context/di` entrypoint that exports the directly constructible `ProxyExecutionContext` class. `ProxyExecutionContext` now implements the synchronous `IExecutionContext` contract and resolves the registered context from the container for each operation. Mutations return `IContext` and are no longer awaitable chains that share a single resolution.

The `executionContextToken` is resolved through the container on every proxy call with `IServiceResolver.resolveOrFail`, so the proxy can be constructed before the container is initialized. Scoped registrations must be used inside `IContainer.run()`. Transient registrations create a new context for each proxy call, so context values are not shared across separate calls; use a singleton or scoped registration when values need to persist.

```ts
import { genericToken, LIFETIME } from "eridu-tech/di/contracts";
import { ExecutionContext } from "eridu-tech/execution-context";
import { AlsExecutionContextAdapter } from "eridu-tech/execution-context/als-execution-context-adapter";
import { ProxyExecutionContext } from "eridu-tech/execution-context/di";

import type { IExecutionContext } from "eridu-tech/execution-context/contracts";

const executionContextToken =
    genericToken<IExecutionContext>("executionContext");

// Register with a container that has already been created.
container.registerFactory({
    token: executionContextToken,
    factory: () => new ExecutionContext(new AlsExecutionContextAdapter()),
    deps: {},
    lifetime: LIFETIME.SINGLETON,
});

export const executionContext = new ProxyExecutionContext({
    container,
    executionContextToken,
});
```

### Breaking changes

- Removed `AsyncExecutionContext` and the asynchronous execution-context contracts (`IAsyncExecutionContext`, `IAsyncContext` and `IAsyncContextChain`). Use `ExecutionContext` and the synchronous `IExecutionContext`/`IContext` contracts instead.
- `ProxyExecutionContext` now implements `IExecutionContext`: context operations return direct values, `getOr()` takes a synchronous lazy default, and `contains()` takes a synchronous predicate. Mutations return `IContext`, not a `PromiseLike` chain. Separate calls to the proxy resolve independently; chaining from a mutation's returned `IContext` continues on that resolved instance.
