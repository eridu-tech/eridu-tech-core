---
sidebar_position: 6
sidebar_label: Plugins
pagination_label: SharedLock plugin
tags:
    - SharedLock
    - Plugins
keywords:
    - SharedLock
    - Plugins
    - withSharedLockPrefix
    - withSharedLockLogging
---

# SharedLock Plugins

## withSharedLockPrefix plugin

The SharedLock prefix plugin intercepts calls to a shared-lock adapter and transparently prefixes all lock keys with a configurable string. This enables logical key namespacing without modifying the adapter implementation.

### Use cases

- **Multi-tenant reader-writer locks** — Prefix lock keys with a tenant identifier to isolate shared lock state between tenants
- **Resource scoping** — Organize shared locks by resource type or module
- **Environment isolation** — Separate development, staging, and production shared lock state
- **Read/write path scoping** — Apply consistent namespacing to both reader and writer lock operations

### How it works

The `withSharedLockPrefix` function returns a [`PluginFn`](/docs/components/foundation/middleware) that calls `enhance` on each adapter method that accepts a shared-lock key. When an enhanced method is invoked, the plugin intercepts the call, prepends the configured prefix to the key argument, and forwards the modified arguments to the original method.

The plugin prefixes keys for the following methods:

| Method          | Key argument                 | Pattern        |
| --------------- | ---------------------------- | -------------- |
| `forceRelease`  | First argument (`key`)       | `prefix + key` |
| `getState`      | First argument (`key`)       | `prefix + key` |
| `acquireWriter` | First argument (`key`)       | `prefix + key` |
| `refreshWriter` | First argument (`key`)       | `prefix + key` |
| `releaseWriter` | First argument (`key`)       | `prefix + key` |
| `acquireReader` | `key` within settings object | `prefix + key` |
| `refreshReader` | First argument (`key`)       | `prefix + key` |

### Usage

```ts file=./samples/with-shared-lock-prefix.ts

```

### Before/after behavior

**Before** — Shared lock keys are used as-is:

```ts file=./samples/unprefixed-acquire-writer.ts

```

**After** — Shared lock keys are automatically prefixed:

```ts file=./samples/prefixed-acquire-writer.ts

```

:::danger
Because `withPlugin` uses `enhance` under the hood, the same edge case applies: if one enhanced method internally calls another enhanced method via `this`, the middleware will apply **twice**. Be mindful of inter-method calls when applying plugins that enhance multiple methods on the same instance.
:::

:::info
For more information about the `withPlugin` function and applying plugins to adapters, see the [Middleware plugin](/docs/components/foundation/middleware/#plugin) documentation.
:::

## withSharedLockLogging plugin

The SharedLock logging plugin intercepts every call to a shared lock adapter and reports it to an `ILogger`. Any shared lock backend becomes a source of observable events without changing the adapter implementation.

### Use cases

- **Reader/writer diagnostics** - See which readers and writers acquire, refresh and release, and in what order
- **Contention analysis** - Correlate failed reader and writer acquisitions with the keys that caused them
- **Auditing** - Keep a record of forced releases and state lookups

### How it works

The `withSharedLockLogging` function returns a [`PluginFn`](/docs/components/foundation/middleware) that calls `enhance` on every adapter method. It only uses the `debug` and `error` methods of the logger, so any [`ILogger`](/docs/components/observability/logger/logger_usage) can be passed in.

A successful call logs a `debug` entry named `<adapter class name>.<methodName> succeeded` with a metadata object holding the call arguments and the returned value. A failed call logs an `error` entry named `<adapter class name>.<methodName> failed` with the call arguments and the thrown value, then re-throws the error so the adapter keeps failing exactly as it did before. Naming entries after the adapter keeps them distinguishable when several adapters share one logger.

| Method          | Logged arguments |
| --------------- | ---------------- |
| `acquireReader` | All arguments    |
| `acquireWriter` | All arguments    |
| `forceRelease`  | All arguments    |
| `getState`      | All arguments    |
| `refreshReader` | All arguments    |
| `refreshWriter` | All arguments    |
| `releaseReader` | All arguments    |
| `releaseWriter` | All arguments    |

### Usage

```ts file=./samples/with-shared-lock-logging.ts

```

:::info
Arguments are forwarded to the logger untouched. Use a logger whose transport drops metadata when shared lock keys are considered sensitive.
:::
