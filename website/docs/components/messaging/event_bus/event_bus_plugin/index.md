---
sidebar_position: 6
sidebar_label: Plugins
pagination_label: EventBus plugin
tags:
    - EventBus
    - Plugins
keywords:
    - EventBus
    - Plugins
    - withEventBusPrefix
    - withEventBusLogging
    - withEventBusSchema
    - withListenerTracking
---

# EventBus Plugins

## withEventBusPrefix plugin

The EventBus prefix plugin intercepts calls to an event bus adapter and transparently prefixes all event names with a configurable string. This enables logical event namespace isolation without modifying the adapter implementation.

### Use cases

- **Multi-tenant systems** — Prefix event names with a tenant identifier to isolate events between tenants
- **Environment isolation** — Separate development, staging, and production event streams
- **Module scoping** — Organize events by feature or module to avoid naming collisions

### How it works

The `withEventBusPrefix` function returns a [`PluginFn`](/docs/components/foundation/middleware) that calls `enhance` on each adapter method that accepts an event name. When an enhanced method is invoked, the plugin intercepts the call, prepends the configured prefix to the event name argument, and forwards the modified arguments to the original method.

The plugin prefixes event names for the following methods:

| Method           | Event name argument | Pattern        |
| ---------------- | ------------------- | -------------- |
| `dispatch`       | First argument      | `prefix + key` |
| `addListener`    | First argument      | `prefix + key` |
| `removeListener` | First argument      | `prefix + key` |

### Usage

```ts file=./samples/with-event-bus-prefix.ts

```

### Before/after behavior

**Before** — Event names are used as-is:

```ts file=./samples/unprefixed-dispatch.ts

```

**After** — Event names are automatically prefixed:

```ts file=./samples/prefixed-dispatch.ts

```

:::danger
Because `withPlugin` uses `enhance` under the hood, the same edge case applies: if one enhanced method internally calls another enhanced method via `this`, the middleware will apply **twice**. Be mindful of inter-method calls when applying plugins that enhance multiple methods on the same instance.
:::

:::info
For more information about the `withPlugin` function and applying plugins to adapters, see the [Middleware plugin](/docs/components/foundation/middleware/#plugin) documentation.
:::

## withListenerTracking plugin

The `withListenerTracking` plugin wraps another plugin with automatic listener-reference tracking. When a middleware plugin intercepts `addListener` and wraps the listener function, the adapter stores the wrapped reference. If the caller later invokes `removeListener` with the original listener, the adapter cannot find it — the reference has changed.

This plugin solves that problem by ensuring that `removeListener` with the original listener correctly resolves through the chain.

### Use cases

- **Listener reference transparency** — Callers can use the original listener function with `removeListener` even when a plugin wraps the listener in `addListener`
- **Plugin safety** — Wrap plugins that transform listeners in `addListener` (for example a plugin that wraps the listener to add logging or validation) to ensure `removeListener` still resolves correctly
- **Per-plugin tracking** — Apply `withListenerTracking` to each plugin that wraps listeners; it does not automatically handle wrapping from other plugins in the chain

:::info
This plugin is only needed if you call `removeListener` at runtime. If you only register listeners during startup and never remove them, listener-reference tracking is unnecessary.
:::

### How it works

`withListenerTracking` wraps the provided plugin and adds tracking layers around `addListener` and `removeListener` on the adapter. When `addListener` is called, the original listener is wrapped with a tracking wrapper and the mapping from original to wrapper is stored in a `ListenerStore` keyed by event name. On `removeListener`, the original listener is resolved back to the tracking wrapper through the store before forwarding the call down the chain.

The plugin execution order is:

1. The user plugin's enhancements are applied first (inner layer)
2. The tracking enhancements are applied second (outermost layer)

### Usage

```ts file=./samples/with-listener-tracking.ts

```

#### Chaining multiple tracking calls

Multiple `withListenerTracking` calls can be composed together:

```ts file=./samples/listener-tracking-chaining.ts

```

:::danger
Because `withPlugin` uses `enhance` under the hood, the same edge case applies: if one enhanced method internally calls another enhanced method via `this`, the middleware will apply **twice**. Be mindful of inter-method calls when applying plugins that enhance multiple methods on the same instance.
:::

:::info
For more information about the `withPlugin` function and applying plugins to adapters, see the [Middleware plugin](/docs/components/foundation/middleware/#plugin) documentation.
:::

## withEventBusLogging plugin

The EventBus logging plugin intercepts every call to an event bus adapter and reports it to an `ILogger`. Any event bus backend becomes a source of observable events without changing the adapter implementation.

### Use cases

- **Event tracing** - See which events are dispatched and which listeners are attached or detached
- **Debugging missing handlers** - Correlate listener registration with the events that are dispatched
- **Auditing** - Keep a record of listener changes in production

### How it works

The `withEventBusLogging` function returns a [`PluginFn`](/docs/components/foundation/middleware) that calls `enhance` on every adapter method. It only uses the `debug` and `error` methods of the logger, so any [`ILogger`](/docs/components/observability/logger/logger_usage) can be passed in.

A successful call logs a `debug` entry named `<adapter class name>.<methodName> succeeded` with a metadata object holding the call arguments and the returned value. A failed call logs an `error` entry named `<adapter class name>.<methodName> failed` with the call arguments and the thrown value, then re-throws the error so the adapter keeps failing exactly as it did before. Naming entries after the adapter keeps them distinguishable when several adapters share one logger.

| Method           | Logged arguments    |
| ---------------- | ------------------- |
| `addListener`    | The event name only |
| `dispatch`       | All arguments       |
| `removeListener` | The event name only |

### Usage

```ts file=./samples/with-event-bus-logging.ts

```

:::info
`addListener` and `removeListener` log only the event name, so listener functions never reach the logger. `dispatch` forwards its arguments untouched, which means dispatched event payloads are included in the entries; use a logger whose transport drops metadata when event payloads are considered sensitive.
:::
