---
"eridu-tech": minor
---

Add `MemoryRateLimiterAdapter` at `eridu-tech/rate-limiter/memory-rate-limiter-adapter`.

- `MemoryRateLimiterAdapter` owns its storage and applies the configured `FIXED_WINDOW` or `SLIDING_WINDOW` policy. `MemoryRateLimiterAdapterSettings` only takes `backoffPolicy` and `rateLimiterPolicy`, so no storage wiring is needed.
- The adapter implements `IDeinitizable` (`deInit()`) and `IPrunable` (`removeAllExpired()`). Both are synchronous.
- State is process-local, so it is shared neither between processes nor across restarts.
