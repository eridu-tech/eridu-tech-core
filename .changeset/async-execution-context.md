---
"eridu-tech": minor
---

New `AsyncExecutionContext`, available from `eridu-tech/execution-context`, as the asynchronous counterpart of `ExecutionContext`:

- Reads return promises, mutations return an `IAsyncContextChain` that is also a `PromiseLike<void>`, and `run()` accepts synchronous or asynchronous invocables.
- `getOr()` accepts async lazy defaults and `contains()` accepts async predicates.
- Works with the existing `IExecutionContextAdapter` implementations, such as `AlsExecutionContextAdapter`.
- `IAsyncCopyableContext` is added as an internal contract so adapters can hold copyable async contexts.
