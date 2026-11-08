---
"eridu-tech": minor
---

Add the logger module: leveled logging with execution-scoped spans and metadata, pluggable transports, composable middlewares, and a DI proxy.

**Contracts**

- `ILogger` offers `debug`, `verbose`, `info`, `warn`, `error` and `fatal`, plus `span`, `scopedMetadata` (values or key-value form) and `putMetadata` (values or key-value form).
- `ILoggerTransport`, `LogData`, `LOG_LEVEL` and `AllLogLevels` describe how entries reach a logging backend. `LOG_LEVEL.VERBOSE` sits between `debug` and `info` for detailed progress information that is still meant for humans.
- `ILoggerResolver` selects a logger with `use(transportName?)`, throwing `DefaultAdapterNotDefinedError` when no alias is passed and no default is configured, and `UnregisteredAdapterError` for an unknown alias.

**Transports**

- `ConsoleLoggerTransport` writes each entry to the matching console method, with `error` and `fatal` both using `console.error` and `verbose` using `console.trace`, rendering `loggedAt` as a `Date` and spans in milliseconds.
- `LogLayerLoggerTransport` forwards each entry to a configured `LogLayer` instance through its level methods, mapping `verbose` to LogLayer's `trace` level, attaching `loggedAt` (when `includeLoggedAt` is enabled) and span durations as metadata, and serializing messages with a configurable serializer (JSON by default). Requires the optional `loglayer` peer dependency.
- `NoOpLoggerTransport` drops every entry.

**Derivables**

- `Logger`, `LoggerSettings` and `LoggerSettingsBase`. `transport` accepts one transport or an iterable of transports, and multiple transports are merged so every entry reaches each of them. `span` attaches the elapsed time of every open span to entries logged while it runs, `scopedMetadata` attaches metadata and restores it when the invocation returns, and `putMetadata` merges into the current scope without opening a new one. Spans and metadata are inert with the default `NoOpExecutionContextAdapter`, so pair the logger with `AlsExecutionContextAdapter`.
- `LoggerResolver`, `LoggerResolverSettings` and `LoggerTransports`. Each alias maps to one transport or an iterable of transports; `init()` creates one `Logger` per alias, and `use(transportName?)` returns it, falling back to `defaultTransport`.

**Middlewares**

- `withLogSpanFactory` (`WithLogSpanResolver`) and `withSyncLogSpanFactory` (`WithSyncLogSpanResolver`) run the wrapped function inside a span.
- `withLoggingFactory` (`WithLoggingResolver`) and `withSyncLoggingFactory` (`WithSyncLoggingResolver`) log the class name (when configured), function name, arguments and return value, reporting failures at the `error` level or `fatal` when `useFatalLevel` is enabled.
- `withMetadataFactory` (`WithMetadataResolver`) and `withSyncMetadataFactory` (`WithSyncMetadataResolver`) scope `filePath`, `class` and `function` metadata to the wrapped function.
- All middleware factories accept an `ILoggerResolver`. Calling the returned factory uses the resolver's default transport, while `use(transportName?)` returns the same middleware bound to the selected transport.

**Dependency injection**

- `ProxyLoggerResolver` and `ProxyLoggerResolverSettings` resolve the logger resolver from an `IServiceResolver` on every operation, then select a logger with `use(transportName?)` or use the default transport. Every `LIFETIME` is supported. Prefer `SINGLETON` or `SCOPED`: a `TRANSIENT` resolver creates new loggers per operation, so spans and metadata do not carry across operations.
