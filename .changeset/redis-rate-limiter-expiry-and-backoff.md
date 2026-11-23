---
"eridu-tech": patch
---

Fix Redis rate limiter expiry and backoff delays.

- `RedisRateLimiterAdapter` no longer drops stored attempts when the Redis server clock runs ahead of the application clock. Entries were written with an absolute expiry taken from the application clock, so with enough clock drift the key expired the moment it was written and the limiter silently reset on every call. Expiry is now relative.
- The exponential, linear and polynomial backoff delays evaluated in Redis now match their in-process counterparts. The exponential delay was computed as `min(maxDelay, minDelay, multiplier^attempt)` instead of `min(maxDelay, minDelay * multiplier^attempt)`, which produced delays far below the configured minimum. This also applies to the Redis circuit breaker.
