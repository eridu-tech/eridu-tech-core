---
sidebar_position: 2
sidebar_label: Resolver classes
pagination_label: Logger resolver classes
tags:
    - Logger
    - Resolvers
keywords:
    - Logger
    - Resolvers
---

# LoggerResolver

The `LoggerResolver` class provides a flexible way to configure and switch between different logger transports at runtime. Every registered alias gets its own `Logger`, and `use()` returns a logger that can target a single alias or several aliases at once.

## Initial configuration

To begin using the `LoggerResolver`, you will need to register all required transports during initialization, then call `init()` to create the per-transport loggers before calling `use()`.

```ts file=./samples/logger-resolver-initial-config.ts

```

:::info
Here is a complete list of settings for the [`LoggerResolver`](https://eridu-tech.github.io/eridu-tech-core/types/Logger.LoggerResolverSettings.html) class.
:::

Two settings control how multiple transports behave:

- `defaultTransport` accepts a single alias or a list of aliases. When a list is configured, `use()` without arguments writes to every listed transport.
- `throwWhenAllFail` decides whether a transport failure is surfaced. It defaults to `true`.

## Usage

### 1. Using the default transport

```ts file=./samples/logger-resolver-default-transport.ts

```

:::danger
Note that if you don't set a default transport, an error will be thrown.
:::

### 2. Specifying a transport explicitly

```ts file=./samples/logger-resolver-specific-transport.ts

```

:::danger
Note that if you specify a non-existent transport, an error will be thrown.
:::

### 3. Logging to multiple transports at once

Pass a list of aliases, or configure a list as `defaultTransport`, to compose several loggers into one:

```ts file=./samples/logger-resolver-multiple-transports.ts

```

Every `ILogger` method (`debug`, `verbose`, `info`, `warn`, `error`, `fatal` and `putMetadata`) forwards to all selected loggers in the order the aliases were given, so an entry is written to every transport.

`run()` nests the invocables of all selected loggers, so the invocable is executed once and every selected transport records the same execution.

### 4. Handling transport failures

```ts file=./samples/logger-resolver-throw-when-all-fail.ts

```

When multiple transports are selected, failures are collected instead of aborting the remaining loggers:

- `throwWhenAllFail: true` (default): the remaining transports are still called and an `UnableToLogError` is thrown only when every selected transport failed. A single broken transport does not break logging.
- `throwWhenAllFail: false`: an `UnableToLogError` is thrown as soon as at least one transport fails, after the remaining loggers are invoked.

In both modes the collected failure causes are wrapped in an `AggregateError`, available through the `cause` property of the thrown `UnableToLogError`.

## Errors

| Error                           | When it is thrown                                                                        |
| ------------------------------- | ---------------------------------------------------------------------------------------- |
| `DefaultAdapterNotDefinedError` | `use()` is called without arguments and no `defaultTransport` is configured.             |
| `UnregisteredAdapterError`      | `use()` receives an alias that is not registered in `transports`.                        |
| `UnableToLogError`              | A composed logger could not write to its transports, as described in `throwWhenAllFail`. |

## Further information

For further information refer to [`eridu-tech/logger`](https://eridu-tech.github.io/eridu-tech-core/modules/Logger.html) API docs.
