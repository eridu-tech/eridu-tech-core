---
"eridu-tech": minor
---

Add the Log module: leveled logging with execution-scoped spans, metadata and groups, pluggable transports, composable middlewares, and a DI proxy.

**Contracts**

- `ILog` offers `debug`, `verbose`, `info`, `warn`, `error` and `fatal`, plus `run` and `putMetadata` (values or key-value form).
- Each level takes the values to log as an array and an optional `LogExtraInfo`, so a group and metadata can be attached to a single entry without opening a scope. The failure levels take a `FailureLogExtraInfo`, which also accepts the `error` of the failure. Only the messages are logged; the group, the metadata and the error travel on the entry.
- `run(invocable, settings?)` is the single way to open a scope. `RunLogSettings` carries the same `group` and `metadata` plus `span`, which names the span that measures the invocation. Entries logged inside inherit the scope, nested scopes merge and are restored on exit, and the return value of the invocation is passed through untouched.
- `putMetadata` merges values into the metadata of the current scope without opening a new one, and the result is not restored afterwards.
- `ILogTransport`, `LogData`, `LogSpans`, `LogMetadata`, `LOG_LEVEL`, `AllLogLevels`, `LogExtraInfo`, `FailureLogExtraInfo` and `RunLogSettings` describe how entries reach a logging backend. `LogData` is self-contained — `level`, `loggedAt` and `messages`, plus optional `group`, `metadata`, `error` and `spans` — so a transport only has to format and output it. `LogMetadata` and `LogSpans` alias the metadata and span maps, and `LOG_LEVEL.VERBOSE` sits between `debug` and `info` for detailed progress information that is still meant for humans.
- `ILogResolver` selects a log with `use(transportName?)`, throwing `DefaultAdapterNotDefinedError` when no alias is passed and no default is configured, and `UnregisteredAdapterError` for an unknown alias.

**Transports**

- `ConsoleLogTransport` writes each entry to the matching console method, with `error` and `fatal` both using `console.error` and `verbose` using `console.trace`. `loggedAt` is rendered as a `Date`, spans in milliseconds, and the optional fields the entry does not carry (`metadata`, `error`, `spans`) are left out.
- `LogLayerLogTransport` forwards each entry to a configured `LogLayer` instance through `LogLayer.raw`, mapping `verbose` to LogLayer's `trace` level. `loggedAt` is attached to the metadata when `includeLoggedAt` is enabled (the default), spans are attached in milliseconds, the `error` is forwarded as is, and a grouped entry is written through `withPrefix` so its messages carry the `[group]` prefix. Logged values are passed through untouched. Requires the optional `loglayer` peer dependency.
- `NoOpLogTransport` drops every entry.

**Derivables**

- `Log`, `LogSettings` and `LogSettingsBase`. `transport` is a single `ILogTransport`. The context tokens default to one set per transport (`Log.<TransportName>.spans`, `.metadata` and `.groupName`) and can be overridden with `spansToken`, `metadataToken` and `groupNameToken`. `run` opens the span, the group and the metadata of the invocation, and `putMetadata` merges into the current scope. Empty `metadata` and `spans` are dropped from the entry, so consumers can tell "nothing attached" from "empty". Scopes are inert with the default `NoOpExecutionContextAdapter`, so pair the log with `AlsExecutionContextAdapter`.
- `LogResolver`, `LogResolverSettings` and `LogTransports`. Each alias maps to one transport; `init()` creates one `Log` per alias, and `use(transportName?)` returns it, falling back to `defaultTransport`.

**Middlewares**

- `withLogSpanFactory` (`WithLogSpanResolver`) and `withSyncLogSpanFactory` (`WithSyncLogSpanResolver`) run the wrapped function through `run` with `span` set to the middleware label, so every entry logged by it carries the elapsed time of the span.
- `withLoggingFactory` (`WithLoggingResolver`) and `withSyncLoggingFactory` (`WithSyncLoggingResolver`) log the class name (when configured), the function name, the comma-joined arguments and the return value at the `verbose` level, and report failures at the `error` level — or `fatal` when `useFatalLevel` is enabled — with the caught error attached, then re-throw it untouched.
- `withMetadataFactory` (`WithMetadataResolver`) and `withSyncMetadataFactory` (`WithSyncMetadataResolver`) run the wrapped function through `run` with `filePath`, `class` and `function` metadata merged with the output of the `metadata` callback, where the built-in entries win on collision.
- All middleware factories accept an `ILogResolver`. Calling the returned factory uses the resolver's default transport, while `use(transportName?)` returns the same middleware bound to the selected transport.

**Dependency injection**

- `ProxyLogResolver`, `ProxyLogResolverSettings` and the `ProxyLog` it hands out resolve the log resolver from an `IServiceResolver` on every operation, then select a log with `use(transportName?)` or use the default transport. Every `LIFETIME` is supported. Prefer `SINGLETON` or `SCOPED`: a `TRANSIENT` resolver creates new logs per operation, so `run` scopes and `putMetadata` do not carry across operations.

**Component plugins**

- `withLockLogging` (`eridu-tech/lock/plugins`), `withSharedLockLogging` (`eridu-tech/shared-lock/plugins`), `withSemaphoreLogging` (`eridu-tech/semaphore/plugins`), `withRateLimiterLogging` (`eridu-tech/rate-limiter/plugins`), `withFileStorageLogging` (`eridu-tech/file-storage/plugins`), `withEventBusLogging` (`eridu-tech/event-bus/plugins`) and `withCircuitBreakerLogging` (`eridu-tech/circuit-breaker/plugins`) log every adapter call through an `ILog`.
- A successful call is reported as a `debug` entry and a failed call as an `error` entry, which is logged before the error is re-thrown unchanged. Entries are named `<component>.<methodName> succeeded` and `<component>.<methodName> failed`.
- On success the call arguments and the returned value are merged into the metadata as `<component>.args` and `<component>.result` before the entry is logged.
- Every call runs inside a `run` scope whose metadata holds the adapter class name as `<component>.adapter`, so calls from several adapters sharing one log stay distinguishable.
- The plugins need the `debug`, `error`, `run` and `putMetadata` methods, so any `Pick<ILog, "debug" | "error" | "run" | "putMetadata">` is accepted.
- `withFileStorageLogging` drops the `data` payload of `put` and `putStream` before logging, so written content never reaches the log while the file key and the remaining settings do.
