---
sidebar_position: 4
sidebar_label: Middlewares
pagination_label: Logger middlewares
tags:
    - Logger
    - Middlewares
    - AOP
keywords:
    - Logger
    - Middlewares
    - AOP
---

# Logger middlewares

## Initial configuration

To begin using the logger middlewares, you'll need to create and configure a `LoggerResolver` instance:

```ts file=./samples/logger-resolver.ts

```

Every factory accepts an `ILoggerResolver`. Calling the returned factory uses the resolver's default transport, while `use(transportName?)` returns the same middleware bound to the selected transport.

## withLogSpanFactory middleware {#with_log_span_factory_middleware}

The log span middleware intercepts function calls and runs them inside a span named after the middleware label, via the selected logger's `span`. Every entry logged while the wrapped function runs carries the elapsed time of that span and of every enclosing span.

### Usage

```ts file=./samples/with-log-span-factory.ts

```

:::info
Here is a complete list of settings for the [`withLogSpanFactory`](https://eridu-tech.github.io/eridu-tech-core/functions/Observability.withLogSpanFactory.html) function.
:::

## withSyncLogSpanFactory middleware {#with_sync_log_span_factory_middleware}

Synchronous variant of [`withLogSpanFactory`](#with_log_span_factory_middleware) for functions that return their value directly.

### Usage

```ts file=./samples/with-sync-log-span-factory.ts

```

:::info
Here is a complete list of settings for the [`withSyncLogSpanFactory`](https://eridu-tech.github.io/eridu-tech-core/functions/Observability.withSyncLogSpanFactory.html) function.
:::

## withLoggingFactory middleware {#with_logging_factory_middleware}

The logging middleware intercepts function calls and logs the class name (when configured), the function name, its arguments and its return value. Failures are reported at the `error` level, or `fatal` when `useFatalLevel` is enabled, and then rethrown untouched.

### Usage

```ts file=./samples/with-logging-factory.ts

```

:::info
Here is a complete list of settings for the [`withLoggingFactory`](https://eridu-tech.github.io/eridu-tech-core/functions/Observability.withLoggingFactory.html) function.
:::

### Settings

| Option          | Type      | Default | Description                                                |
| --------------- | --------- | ------- | ---------------------------------------------------------- |
| `className`     | `string`  |         | Logged as `"class:"` before the function name when defined |
| `useFatalLevel` | `boolean` | `false` | Logs failures at the `fatal` level instead of `error`      |

## withSyncLoggingFactory middleware {#with_sync_logging_factory_middleware}

Synchronous variant of [`withLoggingFactory`](#with_logging_factory_middleware) for functions that return their value directly.

### Usage

```ts file=./samples/with-sync-logging-factory.ts

```

:::info
Here is a complete list of settings for the [`withSyncLoggingFactory`](https://eridu-tech.github.io/eridu-tech-core/functions/Observability.withSyncLoggingFactory.html) function.
:::

## withMetadataFactory middleware {#with_metadata_factory_middleware}

The metadata middleware scopes `filePath`, `class` and `function` metadata to the wrapped function. The metadata is attached through the selected logger's `scopedMetadata`, so it is visible only to entries logged while the wrapped function runs.

### Usage

```ts file=./samples/with-metadata-factory.ts

```

:::info
Here is a complete list of settings for the [`withMetadataFactory`](https://eridu-tech.github.io/eridu-tech-core/functions/Observability.withMetadataFactory.html) function.
:::

### Settings

| Option               | Type                                                           | Default                                | Description                                                                            |
| -------------------- | -------------------------------------------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------- |
| `className`          | `string`                                                       |                                        | Logged as the `class` metadata entry                                                   |
| `getCurrentFilePath` | `Invocable<[], string \| null>`                                | `() => fileURLToPath(import.meta.url)` | Resolves the path logged as the `filePath` metadata entry                              |
| `metadata`           | `Invocable<[args: MetadataSettings], Record<string, unknown>>` | `() => ({})`                           | Returns extra entries to merge into the metadata; the built-in entries take precedence |

## withSyncMetadataFactory middleware {#with_sync_metadata_factory_middleware}

Synchronous variant of [`withMetadataFactory`](#with_metadata_factory_middleware) for functions that return their value directly.

### Usage

```ts file=./samples/with-sync-metadata-factory.ts

```

:::info
Here is a complete list of settings for the [`withSyncMetadataFactory`](https://eridu-tech.github.io/eridu-tech-core/functions/Observability.withSyncMetadataFactory.html) function.
:::

## Further information

For further information refer to [`eridu-tech/logger`](https://eridu-tech.github.io/eridu-tech-core/modules/Observability.html) API docs.
