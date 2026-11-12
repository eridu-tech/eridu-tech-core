---
sidebar_position: 3
sidebar_label: Configuring transports
pagination_label: Configuring logger transports
tags:
    - Logger
    - Configuring transports
    - Console
    - LogLayer
    - NoOp
keywords:
    - Logger
    - Configuring transports
    - Console
    - LogLayer
    - NoOp
---

# Configuring Logger transports

## ConsoleLoggerTransport

Writes entries to the JavaScript console. Each level maps to its console counterpart, `error` and `fatal` both use `console.error`, and `verbose` uses `console.trace`. `loggedAt` is rendered as a `Date` and spans in milliseconds. The remaining fields (`level`, `group`, `messages`, `metadata` and `error`) are forwarded unchanged.

```ts file=./samples/console-logger-transport.ts

```

## NoOpLoggerTransport

Drops every entry. Useful when logging is switched off or in tests.

```ts file=./samples/no-op-logger-transport.ts

```

:::info
`NoOpLoggerTransport` lets you test your app without emitting any output, ideal for unit, integration and E2E tests.
:::

## MemoryLoggerTransport

Stores every entry in memory so tests can assert on them. `entries` returns the stored entries in order, and `clear()` removes them.

```ts file=./samples/memory-logger-transport.ts

```

:::info
Use `MemoryLoggerTransport` to inspect the entries a `Logger` produced without writing to a real backend.
:::

## LogLayerLoggerTransport

To utilize the `LogLayerLoggerTransport`, install the [`"loglayer"`](https://www.npmjs.com/package/loglayer) package and supply a configured `LogLayer` instance.

Each entry is forwarded through `LogLayer.raw`, mapping the logger's `verbose` level to LogLayer's `trace` level. A `group` is applied as a LogLayer prefix (`[group]`), and `error` is forwarded when present. `loggedAt` is rendered as a `Date` and attached to the entry metadata when `includeLoggedAt` is enabled, and spans are attached as milliseconds. Logged values are passed through untouched, leaving serialization to LogLayer.

```ts file=./samples/loglayer-logger-transport.ts

```

### Settings

```ts file=./samples/loglayer-logger-transport-settings.ts

```

| Option            | Type       | Default | Description                                          |
| ----------------- | ---------- | ------- | ---------------------------------------------------- |
| `logger`          | `LogLayer` |         | The LogLayer instance that receives the entries      |
| `includeLoggedAt` | `boolean`  | `true`  | Whether `loggedAt` is attached to the entry metadata |

## Creating your own transport

See [creating adapters](../creating_logger_adapters/index.md) for implementing `ILoggerTransport` and registering a custom transport.

## Further information

For further information refer to [`eridu-tech/logger`](https://eridu-tech.github.io/eridu-tech-core/modules/Observability.html) API docs.
