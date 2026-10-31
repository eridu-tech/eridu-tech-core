---
sidebar_position: 2
sidebar_label: DI integration
pagination_label: ExecutionContext DI container integration
tags:
    - ExecutionContext
    - DI
    - Dependency injection
keywords:
    - ExecutionContext
    - DI
    - Dependency injection
---

# DI Integration

The `ProxyExecutionContext` class provides an [`IAsyncExecutionContext`](../execution_context_usage/index.md) whose underlying execution context is resolved from a [DI container](../../../foundation/di/index.md).

The proxy supports the `IAsyncExecutionContext` operations:

- `run(invocable)` resolves the execution context and runs the invocable inside its context.
- Reads such as `get`, `exists`, `missing`, `contains`, `getOr` and `getOrFail` resolve the execution context for each operation.
- Mutations such as `put`, `add`, `update`, `remove` and `when` return an awaitable `IAsyncContextChain`. A chain reuses a single resolution, so chained mutations are applied to the same execution context.

The proxy resolves the execution context lazily, so it supports the container's configured lifetimes. Scoped registrations must be used inside `container.run()`, while singleton and transient registrations can be used once `container.init()` has been awaited. Create the proxy **before** calling `init()`.

## Initial configuration

Create the container, register the async execution context, and wrap it with `ProxyExecutionContext`:

#### 1. Create the dependency injection container

```ts file=./samples/container.ts

```

#### 2. Register the async execution context and create the proxy

```ts file=./samples/execution-context-di.ts

```

## Usage

### 1. Running code with context

You can run code within a context boundary through the proxy. The context values are accessible throughout the call chain:

```ts file=./samples/execution-context-di-run.ts

```

### 2. Reading context values

Read operations are resolved from the container and delegated to the async execution context:

```ts file=./samples/execution-context-di-read.ts

```

`getOrFail()` throws a `NotFoundExecutionContextError` when the token is missing. Import it from `eridu-tech/execution-context/contracts` to catch it.

### 3. Chaining mutations

Mutating operations return an `IAsyncContextChain` that is also a `PromiseLike<void>`, so an entire chain of mutations can be awaited:

```ts file=./samples/execution-context-di-chain.ts

```

The chain keeps the resolution of the execution context, so every mutation in it targets the same instance.

### 4. Conditional updates

You can conditionally update the context with `when()`:

```ts file=./samples/execution-context-di-conditional.ts

```

### 5. Scoped lifetime

A scoped registration is resolved for each operation, so the proxy has to be used inside `container.run()`:

```ts file=./samples/execution-context-di-scoped.ts

```

Resolving the proxy outside of a scope throws an error.

## Further information

For further information refer to [`eridu-tech/execution-context`](https://eridu-tech.github.io/eridu-tech-core/modules/ExecutionContext.html) API docs.
