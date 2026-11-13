---
sidebar_position: 3
sidebar_label: Configuring transports
pagination_label: Configuring log transports
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

# Configuring Log transports

## ConsoleLogTransport

Writes entries to the JavaScript console. Each level maps to its console counterpart, `error` and `fatal` both use `console.error`, and `verbose` uses `console.trace`. `loggedAt` is rendered as a `Date` and spans in milliseconds. The remaining fields (`level`, `group`, `messages`, `metadata` and `error`) are forwarded unchanged.

```ts file=./samples/console-log-transport.ts

```

## NoOpLogTransport

Drops every entry. Useful when logging is switched off or in tests.

```ts file=./samples/no-op-log-transport.ts

```

:::info
`NoOpLogTransport` lets you test your app without emitting any output, ideal for unit, integration and E2E tests.
:::

## MemoryLogTransport

Stores every entry in memory so tests can assert on them. `entries` returns the stored entries in order, and `clear()` removes them.

```ts file=./samples/memory-log-transport.ts

```

:::info
Use `MemoryLogTransport` to inspect the entries a `Log` produced without writing to a real backend.
:::

## LogLayerLogTransport

To utilize the `LogLayerLogTransport`, install the [`"loglayer"`](https://www.npmjs.com/package/loglayer) package and supply a configured `LogLayer` instance.

Each entry is forwarded through `LogLayer.raw`, mapping the log's `verbose` level to LogLayer's `trace` level. A `group` is applied as a LogLayer prefix (`[group]`), and `error` is forwarded when present. Logged metadata is nested under `attributes`, so it cannot collide with the transport's own fields; `loggedAt` is rendered as a `Date` and spans in milliseconds, both added when available. `loggedAt` can be omitted with `includeLoggedAt: false`. Logged values are passed through untouched, leaving serialization to LogLayer.

```ts file=./samples/loglayer-log-transport.ts

```

### Settings

```ts file=./samples/loglayer-log-transport-settings.ts

```

| Option            | Type       | Default | Description                                          |
| ----------------- | ---------- | ------- | ---------------------------------------------------- |
| `log`             | `LogLayer` |         | The LogLayer instance that receives the entries      |
| `includeLoggedAt` | `boolean`  | `true`  | Whether `loggedAt` is attached to the entry metadata |

## OtelLogTransport

To utilize the `OtelLogTransport`, install the optional [`"@opentelemetry/api"`](https://www.npmjs.com/package/@opentelemetry/api) peer dependency and pass a configured OTel `Log`; by default the transport uses `logs.getLogger("eridu-tech")`.

Each entry is emitted through the OTel `Log` with the matching severity number (`verbose` maps to `TRACE`) and the level name as `severityText`. Logged values become the record `body`, and `group`, `metadata`, `error` and spans in milliseconds are attached as attributes.

```ts file=./samples/otel-log-transport.ts

```

## Creating your own transport

See [creating adapters](../creating_logger_adapters/index.md) for implementing `ILogTransport` and registering a custom transport.

## Further information

For further information refer to [`eridu-tech/log`](https://eridu-tech.github.io/eridu-tech-core/modules/Logger.html) API docs.
