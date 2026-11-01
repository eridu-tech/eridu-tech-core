---
sidebar_position: 7
sidebar_label: Middlewares
pagination_label: RateLimiter middlewares
tags:
    - RateLimiter
    - Middlewares
    - AOP
keywords:
    - RateLimiter
    - Middlewares
    - AOP
---

# RateLimiter middlewares

## Initial configuration

To begin using the rate-limiter middlewares, you'll need to create and configure a `RateLimiterFactoryResolver` instance:

```ts file=./samples/rate-limiter.ts

```

## withRateLimiterFactory middleware {#with_rate_limiter_factory_middleware}

The RateLimiter middleware wraps function calls with a rate limiter, controlling how many times a function can be invoked within a configured policy window. Each unique key (derived from the function's arguments) gets its own rate limit counter. Once the limit is reached, further invocations are blocked until the policy permits attempts again.

### Usage

```ts file=./samples/with-rate-limiter.ts

```

Calling `withRateLimiter()` directly uses the resolver's default adapter (`memory`). Use `withRateLimiter.use("redis")` to run the wrapped function through a specific registered adapter.

:::info
Here is a complete list of settings for the [`withRateLimiter`](https://eridu-tech.github.io/eridu-tech-core/types/RateLimiter.WithRateLimiterSettings.html) function.
:::

### Settings

| Option        | Type                             | Description                                                                                                                          |
| ------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `key`         | `Invocable<TParameters, string>` | A function that produces the rate-limiter key from the wrapped function's arguments. Each unique key gets its own rate-limit counter |
| `limit`       | `number`                         | Maximum number of invocations allowed within the configured window                                                                   |
| `onlyError`   | `boolean`                        | When `true`, only failed (errored) invocations count toward the rate limit. Defaults to `false`                                      |
| `errorPolicy` | `ErrorPolicy`                    | Determines which errors count toward the rate limit. Defaults to treating all errors as failures                                     |

## withHttpRateLimiterError middleware {#with_http_rate_limiter_error_middleware}

The `withHttpRateLimiterError` middleware converts every rate-limiter error thrown by the wrapped endpoint or downstream middleware into an `HttpError`, so the request fails with a meaningful status code instead of a generic `500`. Errors that are not rate-limiter errors are rethrown untouched, and the original error is preserved as the `cause`.

### Usage

```ts file=./samples/with-http-rate-limiter-error.ts

```

### Status codes

| Errors                                                                                                     | Status |
| ---------------------------------------------------------------------------------------------------------- | ------ |
| `BlockedRateLimiterError`                                                                                  | `429`  |
| `UnableToGetStateRateLimiterError`, `UnableToUpdateStateRateLimiterError`, `UnableToResetRateLimiterError` | `503`  |

A `429` response means the rate limiter is blocking requests until the quota resets. The response carries the standard rate-limit headers:

| Header        | Meaning                                  |
| ------------- | ---------------------------------------- |
| `RateLimit`   | The request quota for the current policy |
| `Retry-After` | How many seconds to wait before retrying |

A `503` response means the rate-limiter adapter failed, so the same request can be retried later.

## Further information

For further information refer to [`eridu-tech/rate-limiter`](https://eridu-tech.github.io/eridu-tech-core/modules/RateLimiter.html) API docs.
