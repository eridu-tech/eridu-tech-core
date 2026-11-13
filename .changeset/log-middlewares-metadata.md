---
"eridu-tech": patch
---

Fix the log metadata middlewares.

- `withMetadataFactory` and `withSyncMetadataFactory` are now exported from `eridu-tech/log/middlewares`, so the metadata middleware can be imported from its documented entry point.
- The asynchronous metadata middleware exposes its own API types, `WithMetadata`, `WithMetadataSettings` and `WithMetadataResolver`, instead of reusing `WithLogging`, `WithLoggingSettings` and `WithLoggingResolver`, which belong to `withLoggingFactory`.
