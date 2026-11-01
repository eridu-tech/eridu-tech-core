---
"eridu-tech": minor
---

New `withHttp*Error` middlewares that translate component errors into `HttpError` responses, available from the matching `<module>/middlewares` entry point:

- `withHttpCircuitBreakerError()` from `eridu-tech/circuit-breaker/middlewares` - maps `OpenCircuitBreakerError`, `IsolatedCircuitBreakerError` and every `UnableTo*CircuitBreakerError` to `503`.
- `withHttpRateLimiterError()` from `eridu-tech/rate-limiter/middlewares` - maps `BlockedRateLimiterError` to `429` (setting the `RateLimit` and `Retry-After` headers), plus every `UnableTo*RateLimiterError` to `503`.
- `withHttpLockError()` from `eridu-tech/lock/middlewares` - maps the `Failed*LockError` errors to `409` and every `UnableTo*LockError` to `503`.
- `withHttpSemaphoreError()` from `eridu-tech/semaphore/middlewares` - maps `LimitReachedSemaphoreError` to `429`, the `Failed*SemaphoreError` errors to `409` and every `UnableTo*SemaphoreError` to `503`.
- `withHttpSharedLockError()` from `eridu-tech/shared-lock/middlewares` - maps `LimitReachedReaderSemaphoreError` to `429`, every `Failed*` reader/writer error to `409` and every `UnableTo*` error to `503`.
- `withHttpEventBusError()` from `eridu-tech/event-bus/middlewares` - maps every `UnableTo*EventBusError` to `503`.
- `withHttpFileStorageError()` from `eridu-tech/file-storage/middlewares` - maps `InvalidKeyFileError` to `400`, `KeyNotFoundFileError` to `404` and every `UnableTo*FileError` to `503`.

Blocked rate limiter responses also carry the `RateLimit` and `Retry-After` headers.

Every middleware rethrows errors it does not recognize untouched, preserves the original error as the `HttpError` `cause`, and responds with a fixed message, so keys and other identifiers never leak into the response.
