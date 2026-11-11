---
sidebar_position: 1
sidebar_label: Usage
pagination_label: Logger usage
tags:
    - Logger
    - Usage
    - Spans
    - Metadata
    - Transports
keywords:
    - Logger
    - Usage
    - Spans
    - Metadata
    - Transports
---

# Logger usage

The `eridu-tech/logger` component provides leveled logging with execution-scoped spans and metadata, independent of the underlying logging backend.

## Initial configuration

To begin using the `Logger` class, you'll need to create and configure an instance:

```ts file=./samples/logger-initial-config.ts

```

:::info
Here is a complete list of settings for the [`Logger`](https://eridu-tech.github.io/eridu-tech-core/types/Observability.LoggerSettings.html) class.
:::

## Logging levels

The logger offers the `debug`, `verbose`, `info`, `warn`, `error` and `fatal` levels. `verbose` sits between `debug` and `info` in severity, for detailed progress information that is still meant for humans. Every level takes the values to log as an array.

```ts file=./samples/logger-levels.ts

```

## Grouping and extra info

Each level accepts an optional extra-info object next to the messages. `group` labels the entry, `metadata` attaches values to that entry only without opening a scope, and the failure levels (`warn`, `error`, `fatal`) also accept `errors`.

```ts file=./samples/logger-extra-info.ts

```

## Transports

A transport is the backend that receives the entries. The `transport` setting accepts a single transport or an iterable of transports; when more than one is provided, every entry is forwarded to each of them.

```ts file=./samples/logger-multiple-transports.ts

```

See [configuring transports](../configuring_logger_transports/index.md) for the available transports, and [the resolver](../logger_resolver/index.md) to select a transport by name at runtime.

## Spans

`span` runs an invocation inside a named span. Every entry logged while the span is open carries the elapsed time of that span and of every enclosing span. Entries logged after the span returns do not include it, so log from inside to capture the duration.

```ts file=./samples/logger-span.ts

```

## Metadata

`scopedMetadata` attaches metadata to the entries logged while the invocation runs, in both the values and the key-value form. The metadata is inherited by nested spans and metadata scopes, and restored when the invocation returns.

`putMetadata` merges values into the current scope without opening a new one, and is not restored afterwards.

```ts file=./samples/logger-scoped-metadata.ts

```

## Execution context

Spans and metadata are read and written through an execution context. With the default `NoOpExecutionContextAdapter` they are inert, so pair the logger with the `AlsExecutionContextAdapter` to propagate them across async boundaries.

```ts file=./samples/logger-execution-context.ts

```

## Further information

For further information refer to [`eridu-tech/logger`](https://eridu-tech.github.io/eridu-tech-core/modules/Observability.html) API docs.
