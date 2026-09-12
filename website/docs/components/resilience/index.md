---
tags:
    - Utilities
keywords:
    - Utilities
---

# Resilience

The `eridu-tech/resilience` component provides predefined fault tolerant `middlewares`.

:::info
For further information about `middlewares` refer to [`eridu-tech/middleware`](/docs/components/middleware) documentation.
:::

## Fallback

The `fallback` middleware adds fallback value when an error occurs:

### Usage

```ts file=./samples/fallback-usage.ts

```

:::info
You can provide synchronous or asynchronous [`Invocable<[], TValue | Promise<TValue>>`](/docs/utilities/invocable/) as fallback value.
:::

### Custom ErrorPolicy

You can define an [`ErrorPolicy`](/docs/utilities/error_policy_type/) to specify fallback values for specific error cases:

```ts file=./samples/fallback-error-policy.ts

```

### Callbacks

You can add callback [`Invocable`](/docs/utilities/invocable/) that will be called before the fallback value is returned.

```ts file=./samples/fallback-on-fallback.ts

```

:::info
For more details about `onFallback` callback data, see the OnFallbackData type.
:::

## Retry

The `retry` middleware enables automatic retries for all errors or specific errors, with configurable backoff policies. An error will be thrown when all retry attempts fail.

### Usage

```ts file=./samples/retry-usage.ts

```

### Custom ErrorPolicy

You can define an [`ErrorPolicy`](/docs/utilities/error_policy_type/) to retry specific error cases:

```ts file=./samples/retry-error-policy.ts

```

### Throw last error

By default, a `RetryResilienceError` is thrown when the time window expires. This error aggregates all errors encountered during the retry process. You can instead rethrow the last encountered error:

```ts file=./samples/retry-throw-last-error.ts

```

### Custom BackoffPolicy

You can use custom [`BackoffPolicy`](/docs/components/backoff_policies):

```ts file=./samples/retry-backoff-policy.ts

```

### Callbacks

You can add callback [`Invocable`](/docs/utilities/invocable/) that will be called before execution attempt:

```ts file=./samples/retry-on-execution-attempt.ts

```

You can add callback [`Invocable`](/docs/utilities/invocable/) that will be called before the retry delay starts:

:::info
For more details about `onExecutionAttempt` callback data, see the `OnRetryAttemptData` type.
:::

```ts file=./samples/retry-on-retry-delay.ts

```

:::info
For more details about `onRetryDelay` callback data, see the `OnRetryDelayData` type.
:::

## Retry by interval

The `retryInterval` middleware retries a function repeatedly within a given time window, waiting a fixed interval between each attempt. A `RetryIntervalResilienceError` is thrown when the time window expires and all attempts have failed.

### Usage

```ts file=./samples/retry-interval-usage.ts

```

### Custom ErrorPolicy

You can define an [`ErrorPolicy`](/docs/utilities/error_policy_type/) to retry only specific error cases:

```ts file=./samples/retry-interval-error-policy.ts

```

### Throw last error

By default, a `RetryIntervalResilienceError` is thrown when the time window expires. This error aggregates all errors encountered during the retry process. You can instead rethrow the last encountered error:

```ts file=./samples/retry-interval-throw-last-error.ts

```

### Callbacks

You can add callback [`Invocable`](/docs/utilities/invocable/) that will be called before each execution attempt:

```ts file=./samples/retry-interval-on-execution-attempt.ts

```

:::info
For more details about `onExecutionAttempt` callback data, see the `OnRetryAttemptData` type.
:::

You can add callback [`Invocable`](/docs/utilities/invocable/) that will be called before the retry delay starts:

```ts file=./samples/retry-interval-on-retry-delay.ts

```

:::info
For more details about `onRetryDelay` callback data, see the `OnRetryDelayData` type.
:::

## Timeout

The `timeout` middleware automatically aborts functions after a specified time period, throwing an error when aborted.

### Usage

```ts file=./samples/timeout-usage.ts

```

### Callbacks

You can add callback [`Invocable`](/docs/utilities/invocable/) that will be called before the timeout occurs.

```ts file=./samples/timeout-on-timeout.ts

```

:::info
For more details about `onTimeout` callback data, see the `OnTimeoutData` type.
:::

## Further information

For further information refer to [`eridu-tech/resilience`](https://eridu-tech.github.io/eridu-tech-core/modules/Resilience.html) API docs.
