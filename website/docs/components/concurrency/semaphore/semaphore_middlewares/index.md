---
sidebar_position: 5
sidebar_label: Middlewares
pagination_label: Semaphore middlewares
tags:
    - Semaphore
    - Middlewares
    - AOP
keywords:
    - Semaphore
    - Middlewares
    - AOP
---

# Semaphore middlewares

## Initial configuration

To begin using the semaphore middlewares, you'll need to create and configure a `SemaphoreFactoryResolver` instance:

```ts file=./samples/semaphore.ts

```

## withSemaphoreFactory middleware {#with_semaphore_factory_middleware}

The Semaphore middleware wraps function calls with a distributed semaphore, limiting the number of concurrent executions across processes. Before executing the wrapped function, a slot is acquired on a key derived from the function's arguments. If the maximum number of concurrent slots (`limit`) has already been reached, the call waits (or fails immediately for non-blocking semaphores) until a slot becomes available.

### Usage

```ts file=./samples/with-semaphore.ts

```

Calling `withSemaphore()` directly uses the resolver's default adapter (`memory`). Use `withSemaphore.use("redis")` to run the wrapped function through a specific registered adapter.

:::info
Here is a complete list of settings for the [`withSemaphore`](https://eridu-tech.github.io/eridu-tech-core/types/Semaphore.WithSemaphoreSettings.html) function.
:::

### Settings

| Option   | Type                             | Description                                                                                                                                       |
| -------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `key`    | `Invocable<TParameters, string>` | A function that produces the semaphore key from the wrapped function's arguments. All consumers using the same key share the same semaphore limit |
| `limit`  | `number`                         | Maximum number of concurrent slots (consumers) allowed for the semaphore key                                                                      |
| `slotId` | `Invocable<TParameters, string>` | Optional function that produces a unique slot identifier for the current acquisition attempt. Defaults to a UUID (`v4`)                           |
| `ttl`    | `ITimeSpan \| null`              | Time-to-live for each acquired slot. `null` means slots never expire automatically; if omitted the factory's default TTL is used                  |

## withHttpSemaphoreError middleware {#with_http_semaphore_error_middleware}

The `withHttpSemaphoreError` middleware converts every semaphore error thrown by the wrapped endpoint or downstream middleware into an `HttpError`, so the request fails with a meaningful status code instead of a generic `500`. Errors that are not semaphore errors are rethrown untouched, and the original error is preserved as the `cause`.

### Usage

```ts file=./samples/with-http-semaphore-error.ts

```

### Status codes

| Errors                                                                                                                                                                       | Status |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| `LimitReachedSemaphoreError`                                                                                                                                                 | `429`  |
| `FailedRefreshSemaphoreError`, `FailedReleaseSemaphoreError`                                                                                                                 | `409`  |
| `UnableToAcquireSemaphoreError`, `UnableToReleaseSemaphoreError`, `UnableToForceReleaseAllSemaphoreError`, `UnableToRefreshSemaphoreError`, `UnableToGetStateSemaphoreError` | `503`  |

A `429` response means the semaphore has no free slot left. A `409` response means the caller's slot is no longer valid. A `503` response means the semaphore adapter failed, so the same request can be retried later. The original error is preserved as the `cause`, and no identifiers are exposed in the response body.

## Further information

For further information refer to [`eridu-tech/semaphore`](https://eridu-tech.github.io/eridu-tech-core/modules/Semaphore.html) API docs.
