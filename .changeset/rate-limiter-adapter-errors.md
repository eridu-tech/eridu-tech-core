---
"eridu-tech": minor
---

New `UnableTo` errors that describe a rate limiter adapter failure, available from `eridu-tech/rate-limiter/contracts`:

- `UnableToGetStateRateLimiterError`
- `UnableToUpdateStateRateLimiterError`
- `UnableToResetRateLimiterError`

They are registered in `RATE_LIMITER_ERRORS`, so `isRateLimiterError()` and `AllRateLimiterErrors` include them. Each error wraps the unexpected adapter error as its `cause`, and `getState()`, `runOrFail()` and `reset()` now document the `UnableTo` error they can throw when the underlying adapter fails, alongside `BlockedRateLimiterError`.

The new `handleUnexpectedRateLimiterAdapterError` plugin applies that mapping to every adapter method. `RateLimiterFactory` wraps the provided adapter with it internally, so `try`/`catch` covers `getState`, `updateState` and `reset` and rethrows the matching error with the original error as its cause. Rate limiters created by the factory, including deserialized ones, therefore only reject with rate limiter errors.
