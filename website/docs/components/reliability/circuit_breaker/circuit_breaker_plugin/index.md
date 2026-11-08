---
sidebar_position: 8
sidebar_label: Plugins
pagination_label: CircuitBreaker plugin
tags:
    - CircuitBreaker
    - Plugins
keywords:
    - CircuitBreaker
    - Plugins
    - withCircuitBreakerPrefix
    - withCircuitBreakerLogging
---

# CircuitBreaker Plugins

## withCircuitBreakerPrefix plugin

The CircuitBreaker prefix plugin intercepts calls to a circuit-breaker adapter and transparently prefixes all circuit keys with a configurable string. This enables logical key namespacing without modifying the adapter implementation.

### Use cases

- **Multi-tenant systems** — Prefix circuit keys with a tenant identifier to isolate circuit state between tenants
- **Service versioning** — Separate circuit state for different API versions
- **Environment isolation** — Keep development, staging, and production circuit state separate
- **Region scoping** — Prefix keys with a region identifier in multi-region deployments

### How it works

The `withCircuitBreakerPrefix` function returns a [`PluginFn`](/docs/components/foundation/middleware) that calls `enhance` on each adapter method that accepts a circuit key. When an enhanced method is invoked, the plugin intercepts the call, prepends the configured prefix to the key argument, and forwards the modified arguments to the original method.

The plugin prefixes keys for the following methods:

| Method         | Key argument           | Pattern        |
| -------------- | ---------------------- | -------------- |
| `getState`     | First argument (`key`) | `prefix + key` |
| `isolate`      | First argument (`key`) | `prefix + key` |
| `reset`        | First argument (`key`) | `prefix + key` |
| `trackFailure` | First argument (`key`) | `prefix + key` |
| `trackSuccess` | First argument (`key`) | `prefix + key` |
| `updateState`  | First argument (`key`) | `prefix + key` |

### Usage

```ts file=./samples/with-circuit-breaker-prefix.ts

```

### Before/after behavior

**Before** — Circuit keys are used as-is:

```ts file=./samples/unprefixed-circuit-lookup.ts

```

**After** — Circuit keys are automatically prefixed:

```ts file=./samples/prefixed-circuit-lookup.ts

```

:::danger
Because `withPlugin` uses `enhance` under the hood, the same edge case applies: if one enhanced method internally calls another enhanced method via `this`, the middleware will apply **twice**. Be mindful of inter-method calls when applying plugins that enhance multiple methods on the same instance.
:::

:::info
For more information about the `withPlugin` function and applying plugins to adapters, see the [Middleware plugin](/docs/components/foundation/middleware/#plugin) documentation.
:::

## withCircuitBreakerLogging plugin

The CircuitBreaker logging plugin intercepts every call to a circuit breaker adapter and reports it to an `ILogger`. Any circuit breaker backend becomes a source of observable events without changing the adapter implementation.

### Use cases

- **State transition auditing** - See when a circuit opens, closes or is isolated manually
- **Failure tracking diagnostics** - Correlate tracked failures and successes with the keys that produced them
- **Production observability** - Follow circuit state changes next to the rest of the application logs

### How it works

The `withCircuitBreakerLogging` function returns a [`PluginFn`](/docs/components/foundation/middleware) that calls `enhance` on every adapter method. It only uses the `debug` and `error` methods of the logger, so any [`ILogger`](/docs/components/observability/logger/logger_usage) can be passed in.

A successful call logs a `debug` entry named `circuit-breaker.<methodName> succeeded`, after merging the call arguments and the returned value into the metadata as `circuit-breaker.args` and `circuit-breaker.result` (for `updateState` the result is the state transition). A failed call logs an `error` entry named `circuit-breaker.<methodName> failed`, then re-throws the error so the adapter keeps failing exactly as it did before. Every call also runs inside the `circuit-breaker.adapter` scoped metadata, which holds the adapter class name, so entries from several adapters sharing one logger stay distinguishable.

| Method         | Logged arguments |
| -------------- | ---------------- |
| `getState`     | All arguments    |
| `isolate`      | All arguments    |
| `reset`        | All arguments    |
| `trackFailure` | All arguments    |
| `trackSuccess` | All arguments    |
| `updateState`  | All arguments    |

### Usage

```ts file=./samples/with-circuit-breaker-logging.ts

```

:::info
Arguments are forwarded to the logger untouched. Use a logger whose transport drops metadata when circuit breaker keys are considered sensitive.
:::
