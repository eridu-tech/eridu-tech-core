---
sidebar_position: 8
sidebar_label: Plugins
pagination_label: RateLimiter plugin
tags:
    - RateLimiter
    - Plugins
keywords:
    - RateLimiter
    - Plugins
    - withRateLimiterPrefix
    - withRateLimiterLogging
---

# RateLimiter Plugins

## withRateLimiterPrefix plugin

The RateLimiter prefix plugin intercepts calls to a rate-limiter adapter and transparently prefixes all rate-limiter keys with a configurable string. This enables logical key namespacing without modifying the adapter implementation.

### Use cases

- **Multi-tenant rate limiting** — Prefix rate-limiter keys with a tenant identifier to apply separate rate limits per tenant
- **Endpoint scoping** — Organize rate limits by API endpoint or route prefix
- **Environment isolation** — Separate development, staging, and production rate limit state
- **User tier differentiation** — Prefix keys with a tier identifier (e.g., "free:", "premium:") to apply different rate limits

### How it works

The `withRateLimiterPrefix` function returns a [`PluginFn`](/docs/components/foundation/middleware) that calls `enhance` on each adapter method that accepts a rate-limiter key. When an enhanced method is invoked, the plugin intercepts the call, prepends the configured prefix to the key argument, and forwards the modified arguments to the original method.

The plugin prefixes keys for the following methods:

| Method        | Key argument           | Pattern        |
| ------------- | ---------------------- | -------------- |
| `getState`    | First argument (`key`) | `prefix + key` |
| `reset`       | First argument (`key`) | `prefix + key` |
| `updateState` | First argument (`key`) | `prefix + key` |

### Usage

```ts file=./samples/with-rate-limiter-prefix.ts

```

### Before/after behavior

**Before** — Rate-limiter keys are used as-is:

```ts file=./samples/unprefixed-get-state.ts

```

**After** — Rate-limiter keys are automatically prefixed:

```ts file=./samples/prefixed-get-state.ts

```

:::danger
Because `withPlugin` uses `enhance` under the hood, the same edge case applies: if one enhanced method internally calls another enhanced method via `this`, the middleware will apply **twice**. Be mindful of inter-method calls when applying plugins that enhance multiple methods on the same instance.
:::

:::info
For more information about the `withPlugin` function and applying plugins to adapters, see the [Middleware plugin](/docs/components/foundation/middleware/#plugin) documentation.
:::

## withRateLimiterLogging plugin

The RateLimiter logging plugin intercepts every call to a rate limiter adapter and reports it to an `ILogger`. Any rate limiter backend becomes a source of observable events without changing the adapter implementation.

### Use cases

- **Throttling diagnostics** - See which keys are checked and which attempts are blocked
- **Quota analysis** - Correlate exceeded limits with the keys and limits that caused them
- **Auditing** - Keep a record of manual resets

### How it works

The `withRateLimiterLogging` function returns a [`PluginFn`](/docs/components/foundation/middleware) that calls `enhance` on every adapter method. It only uses the `debug` and `error` methods of the logger, so any [`ILogger`](/docs/components/observability/logger/logger_usage) can be passed in.

A successful call logs a `debug` entry named `rate-limiter.<methodName> succeeded`, after merging the call arguments and the returned value into the metadata as `rate-limiter.args` and `rate-limiter.result`. A failed call logs an `error` entry named `rate-limiter.<methodName> failed` with the call arguments and the thrown value, then re-throws the error so the adapter keeps failing exactly as it did before. Every call also runs inside the `rate-limiter.adapter` scoped metadata, which holds the adapter class name, so entries from several adapters sharing one logger stay distinguishable.

| Method        | Logged arguments |
| ------------- | ---------------- |
| `getState`    | All arguments    |
| `reset`       | All arguments    |
| `updateState` | All arguments    |

### Usage

```ts file=./samples/with-rate-limiter-logging.ts

```

:::info
Arguments are forwarded to the logger untouched. Use a logger whose transport drops metadata when rate limiter keys are considered sensitive.
:::
