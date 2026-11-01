---
"eridu-tech": patch
---

Fixed `NotFoundExecutionContextError` missing from `eridu-tech/execution-context/contracts`.

- `execution-context.errors.ts` was never re-exported by the contracts entrypoint, so `getOrFail()` could throw an error that consumers had no way to import and detect.
- `NotFoundExecutionContextError` is now exported from `eridu-tech/execution-context/contracts`, alongside the execution context contracts.
