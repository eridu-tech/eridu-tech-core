---
sidebar_position: 6
sidebar_label: Plugins
pagination_label: Semaphore plugin
tags:
    - Semaphore
    - Plugins
keywords:
    - Semaphore
    - Plugins
    - withSemaphorePrefix
    - withSemaphoreLogging
---

# Semaphore Plugins

## withSemaphorePrefix plugin

The Semaphore prefix plugin intercepts calls to a semaphore adapter and transparently prefixes all semaphore keys with a configurable string. This enables logical key namespacing without modifying the adapter implementation.

### Use cases

- **Multi-tenant semaphores** — Prefix semaphore keys with a tenant identifier to isolate concurrency limits between tenants
- **Resource scoping** — Organize semaphores by resource type to avoid key collisions
- **Environment isolation** — Separate development, staging, and production semaphore state
- **Pool differentiation** — Prefix keys with a pool name to manage independent semaphore pools

### How it works

The `withSemaphorePrefix` function returns a [`PluginFn`](/docs/components/foundation/middleware) that calls `enhance` on each adapter method that accepts a semaphore key. When an enhanced method is invoked, the plugin intercepts the call, prepends the configured prefix to the key argument, and forwards the modified arguments to the original method.

The plugin prefixes keys for the following methods:

| Method            | Key argument                 | Pattern        |
| ----------------- | ---------------------------- | -------------- |
| `acquire`         | `key` within settings object | `prefix + key` |
| `forceReleaseAll` | First argument (`key`)       | `prefix + key` |
| `getState`        | First argument (`key`)       | `prefix + key` |
| `refresh`         | First argument (`key`)       | `prefix + key` |
| `release`         | First argument (`key`)       | `prefix + key` |

### Usage

```ts file=./samples/with-semaphore-prefix.ts

```

### Before/after behavior

**Before** — Semaphore keys are used as-is:

```ts file=./samples/unprefixed-acquire.ts

```

**After** — Semaphore keys are automatically prefixed:

```ts file=./samples/prefixed-acquire.ts

```

:::danger
Because `withPlugin` uses `enhance` under the hood, the same edge case applies: if one enhanced method internally calls another enhanced method via `this`, the middleware will apply **twice**. Be mindful of inter-method calls when applying plugins that enhance multiple methods on the same instance.
:::

:::info
For more information about the `withPlugin` function and applying plugins to adapters, see the [Middleware plugin](/docs/components/foundation/middleware/#plugin) documentation.
:::

## withSemaphoreLogging plugin

The Semaphore logging plugin intercepts every call to a semaphore adapter and reports it to an `ILogger`. Any semaphore backend becomes a source of observable events without changing the adapter implementation.

### Use cases

- **Slot diagnostics** - See which slots are acquired, refreshed and released, and for how long
- **Contention analysis** - Correlate failed acquisitions with the semaphore keys that caused them
- **Auditing** - Keep a record of force releases and state lookups

### How it works

The `withSemaphoreLogging` function returns a [`PluginFn`](/docs/components/foundation/middleware) that calls `enhance` on every adapter method. It only uses the `debug` and `error` methods of the logger, so any [`ILogger`](/docs/components/observability/logger/logger_usage) can be passed in.

A successful call logs a `debug` entry named `semaphore.<methodName> succeeded`, after merging the call arguments and the returned value into the metadata as `semaphore.args` and `semaphore.result`. A failed call logs an `error` entry named `semaphore.<methodName> failed` with the call arguments and the thrown value, then re-throws the error so the adapter keeps failing exactly as it did before. Every call also runs inside the `semaphore.adapter` scoped metadata, which holds the adapter class name, so entries from several adapters sharing one logger stay distinguishable.

| Method            | Logged arguments |
| ----------------- | ---------------- |
| `acquire`         | All arguments    |
| `forceReleaseAll` | All arguments    |
| `getState`        | All arguments    |
| `refresh`         | All arguments    |
| `release`         | All arguments    |

### Usage

```ts file=./samples/with-semaphore-logging.ts

```

:::info
Arguments are forwarded to the logger untouched. Use a logger whose transport drops metadata when semaphore keys are considered sensitive.
:::
