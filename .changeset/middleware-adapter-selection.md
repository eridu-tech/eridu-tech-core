---
"eridu-tech": patch
---

Added `.use(adapter)` support to `withInvalidationFactory`, `withDispatchBeforeFactory`, `withDispatchAfterFactory`, and `withDispatchOnErrorFactory`. Each middleware can now use a specific registered cache or event-bus adapter. Calling the factory directly continues to use the resolver's configured default adapter.
