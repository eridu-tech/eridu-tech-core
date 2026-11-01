---
sidebar_position: 5
sidebar_label: Middlewares
pagination_label: SharedLock middlewares
tags:
    - SharedLock
    - Middlewares
    - AOP
keywords:
    - SharedLock
    - Middlewares
    - AOP
---

# SharedLock middlewares

## Initial configuration

To begin using the shared-lock middlewares, you'll need to create and configure a `SharedLockFactoryResolver` instance:

```ts file=./samples/shared-lock.ts

```

## withSharedLockFactory middleware {#with_shared_lock_factory_middleware}

The SharedLock middleware wraps function calls with a distributed shared lock (reader-writer lock), providing concurrency control with two access modes: **Reader mode** (`"READER"`) allows multiple callers to execute the wrapped function concurrently as long as no writer holds the lock, while **Writer mode** (`"WRITER"`) grants exclusive access. Before executing the wrapped function, the appropriate lock is acquired on a key derived from the function's arguments.

### Usage

```ts file=./samples/with-shared-lock.ts

```

Calling `withSharedLock()` directly uses the resolver's default adapter (`memory`). Use `withSharedLock.use("redis")` to run the wrapped function through a specific registered adapter.

:::info
Here is a complete list of settings for the [`withSharedLock`](https://eridu-tech.github.io/eridu-tech-core/types/SharedLock.WithSharedLockFactorySettings.html) function.
:::

### Settings

| Option   | Type                             | Description                                                                                                                             |
| -------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `key`    | `Invocable<TParameters, string>` | A function that produces the lock key from the wrapped function's arguments. All consumers using the same key share the same lock state |
| `when`   | `SharedLockWhenSetting`          | Whether to acquire the lock in `"READER"` or `"WRITER"` mode                                                                            |
| `limit`  | `number`                         | Maximum number of concurrent readers allowed when the lock is acquired in reader mode                                                   |
| `lockId` | `Invocable<TParameters, string>` | Optional function that produces a unique identifier for the current lock acquisition attempt. Defaults to a UUID (`v4`)                 |
| `ttl`    | `ITimeSpan \| null`              | Time-to-live for the lock. `null` means the lock never expires automatically; if omitted the factory's default TTL is used              |

## withHttpSharedLockError middleware {#with_http_shared_lock_error_middleware}

The `withHttpSharedLockError` middleware converts every shared-lock error (reader semaphore, writer lock and shared-lock errors) thrown by the wrapped endpoint or downstream middleware into an `HttpError`, so the request fails with a meaningful status code instead of a generic `500`. Errors that are not shared-lock errors are rethrown untouched, and the original error is preserved as the `cause`.

### Usage

```ts file=./samples/with-http-shared-lock-error.ts

```

### Status codes

| Errors                                                                                                                                                                                                                                                                                              | Status |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| `LimitReachedReaderSemaphoreError`                                                                                                                                                                                                                                                                  | `429`  |
| `FailedRefreshReaderSemaphoreError`, `FailedReleaseReaderSemaphoreError`, `FailedAcquireWriterLockError`, `FailedRefreshWriterLockError`, `FailedReleaseWriterLockError`                                                                                                                            | `409`  |
| `UnableToAcquireReaderSemaphoreError`, `UnableToReleaseReaderSemaphoreError`, `UnableToRefreshReaderSemaphoreError`, `UnableToAcquireWriterLockError`, `UnableToReleaseWriterLockError`, `UnableToRefreshWriterLockError`, `UnableToForceReleaseSharedLockError`, `UnableToGetStateSharedLockError` | `503`  |

A `429` response means the reader semaphore has no free slot left. A `409` response means the caller's slot or lock is no longer valid or is owned by another caller. A `503` response means the shared-lock adapter failed, so the same request can be retried later. The original error is preserved as the `cause`, and no identifiers are exposed in the response body.

## Further information

For further information refer to [`eridu-tech/shared-lock`](https://eridu-tech.github.io/eridu-tech-core/modules/SharedLock.html) API docs.
