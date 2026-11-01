---
sidebar_position: 5
sidebar_label: Middlewares
pagination_label: Lock middlewares
tags:
    - Lock
    - Middlewares
    - AOP
keywords:
    - Lock
    - Middlewares
    - AOP
---

# Lock middlewares

## Initial configuration

To begin using the lock middlewares, you'll need to create and configure a `LockFactoryResolver` instance:

```ts file=./samples/lock.ts

```

## withLockFactory middleware {#with_lock_factory_middleware}

The Lock middleware wraps function calls with a distributed lock, ensuring mutual exclusion across processes. Before executing the wrapped function, a lock is acquired on a key derived from the function's arguments. If another process already holds the lock, the call waits (or fails immediately for non-blocking locks) until the lock is released.

### Usage

```ts file=./samples/with-lock.ts

```

Calling `withLock()` directly uses the resolver's default adapter (`memory`). Use `withLock.use("redis")` to run the wrapped function through a specific registered adapter.

:::info
Here is a complete list of settings for the [`withLock`](https://eridu-tech.github.io/eridu-tech-core/types/Lock.WithLockSettings.html) function.
:::

### Settings

| Option   | Type                             | Description                                                                                                                                                                |
| -------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `key`    | `Invocable<TParameters, string>` | A function that produces the lock key from the wrapped function's arguments. The lock is acquired on this key, ensuring mutual exclusion across processes for the same key |
| `lockId` | `Invocable<TParameters, string>` | Optional function that produces a unique identifier for the current lock acquisition attempt. Defaults to a UUID (`v4`)                                                    |
| `ttl`    | `ITimeSpan \| null`              | Time-to-live for the lock. `null` means the lock never expires automatically; if omitted the factory's default TTL is used                                                 |

## withHttpLockError middleware {#with_http_lock_error_middleware}

The `withHttpLockError` middleware converts every lock error thrown by the wrapped endpoint or downstream middleware into an `HttpError`, so the request fails with a meaningful status code instead of a generic `500`. Errors that are not lock errors are rethrown untouched, and the original error is preserved as the `cause`.

### Usage

```ts file=./samples/with-http-lock-error.ts

```

### Status codes

| Errors                                                                                                                                           | Status |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| `FailedAcquireLockError`, `FailedRefreshLockError`, `FailedReleaseLockError`                                                                     | `409`  |
| `UnableToAcquireLockError`, `UnableToReleaseLockError`, `UnableToForceReleaseLockError`, `UnableToRefreshLockError`, `UnableToGetStateLockError` | `503`  |

A `409` response means the lock is owned by another caller or is no longer valid. A `503` response means the lock adapter failed, so the same request can be retried later. The original error is preserved as the `cause`, and no identifiers are exposed in the response body.

## Further information

For further information refer to [`eridu-tech/lock`](https://eridu-tech.github.io/eridu-tech-core/modules/Lock.html) API docs.
