---
"eridu-tech": minor
---

Error instances in `eridu-tech/rate-limiter/contracts` now expose the rate limiter `key` they were created for:

- `BlockedRateLimiterError.key`
- `UnableToGetStateRateLimiterError.key`
- `UnableToUpdateStateRateLimiterError.key`
- `UnableToResetRateLimiterError.key`

Each `create()` factory passes the key to the error, so it is available as a `readonly` field alongside the existing `message`, `state` and `cause`.
