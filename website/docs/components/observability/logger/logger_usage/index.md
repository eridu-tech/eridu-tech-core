---
sidebar_position: 1
sidebar_label: Usage
pagination_label: Logger usage
tags:
    - Logger
    - Usage
    - Runs
    - Spans
    - Metadata
    - Transports
keywords:
    - Logger
    - Usage
    - Runs
    - Spans
    - Metadata
    - Transports
---

# Logger usage

The `eridu-tech/logger` component provides leveled logging with run-scoped groups, metadata, and spans, independent of the underlying logging backend.

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

Each level accepts an optional extra-info object next to the messages. `group` labels the entry, `metadata` attaches values to that entry only without opening a scope, and the failure levels (`warn`, `error`, `fatal`) also accept `error`.

```ts file=./samples/logger-extra-info.ts

```

## Transports

A transport is the backend that receives the entries. A `Logger` writes to a single transport; use [the resolver](../logger_resolver/index.md) to switch transports by name at runtime.

See [configuring transports](../configuring_logger_transports/index.md) for the available transports.

## Scoped runs

`run` executes an invocation inside a logging scope and returns its result. When the settings set `group` or `metadata`, entries logged inside the scope carry them; `span` measures the elapsed time of the scope. The scope ends when the invocation returns, so log from inside to capture it.

```ts file=./samples/logger-run.ts

```

Scopes nest: an entry carries the elapsed time of every open span.

## Metadata

Pass `metadata` to `run` to attach values to every entry logged while the invocation runs. Nested scopes merge their metadata, and the outer metadata is restored when the invocation returns.

`putMetadata` merges values into the current scope without opening a new one, and is not restored afterwards.

```ts file=./samples/logger-metadata.ts

```

## Execution context

Run scopes are read and written through an execution context. With the default `NoOpExecutionContextAdapter` they are inert, so pair the logger with the `AlsExecutionContextAdapter` to propagate them across async boundaries.

```ts file=./samples/logger-execution-context.ts

```

## Further information

For further information refer to [`eridu-tech/logger`](https://eridu-tech.github.io/eridu-tech-core/modules/Observability.html) API docs.
