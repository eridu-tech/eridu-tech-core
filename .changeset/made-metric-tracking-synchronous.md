---
"eridu-tech": minor
---

Made metric tracking synchronous in the `CircuitBreakerFactory` and `RateLimiterFactory` components.

Metric tracking is now always awaited, so circuit-breaker and rate-limiter state no longer lags behind in-flight calls, and the rate-limiter can no longer allow more attempts than its `limit`.

### Breaking changes

- Removed `enableAsyncTracking` from `RateLimiterFactorySettingsBase`. The setting only had an effect when `onlyError` was `true`, and backgrounding the metric could let the limiter exceed its `limit`.
- `CircuitBreakerFactory` no longer tracks metrics in the background by default; `enableAsyncTracking` now defaults to `false`.

### Migration

Remove the `enableAsyncTracking` option from `RateLimiterFactory`:

**Before:**

```ts
import { RateLimiterFactory } from "eridu-tech/rate-limiter";

const rateLimiterFactory = new RateLimiterFactory({
    adapter,
    onlyError: true,
    enableAsyncTracking: false,
});
```

**After:**

```ts
import { RateLimiterFactory } from "eridu-tech/rate-limiter";

const rateLimiterFactory = new RateLimiterFactory({
    adapter,
    onlyError: true,
});
```

Opt the circuit-breaker back in to background tracking:

```ts
import { CircuitBreakerFactory } from "eridu-tech/circuit-breaker";

const circuitBreakerFactory = new CircuitBreakerFactory({
    adapter,
    enableAsyncTracking: true,
});
```
