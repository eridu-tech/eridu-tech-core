---
"eridu-tech": minor
---

Consolidate the rate limiter policy API in `eridu-tech/rate-limiter/contracts` and remove the `eridu-tech/rate-limiter/policies` module.

- `LIMITER_POLICIES`, `FixedWindowLimiterSettings`, `SlidingWindowLimiterSettings`, `FixedWindowLimiterSettingsEnum`, `SlidingWindowLimiterSettingsEnum` and `RateLimiterPolicySettingsEnum` now live in `eridu-tech/rate-limiter/contracts`. Import them from there instead of `eridu-tech/rate-limiter/policies`.
- The public `FixedWindowLimiter` and `SlidingWindowLimiter` policy classes, their `resolve*Settings`/`serialize*Settings` helpers, the `Serialized*` settings types and the `IRateLimiterPolicy` contract are no longer exported; the adapters apply the policy internally.
- Per-policy metrics and state types are exported from `eridu-tech/rate-limiter/contracts` as `FixedWindowLimiterMetrics`, `SlidingWindowLimiterMetrics`, `AllowedState`, `BlockedState` and `AllRateLimiterState`. `FixedWindowLimiterState` and `SlidingWindowLimiterState` are renamed to `FixedWindowLimiterMetrics` and `SlidingWindowLimiterMetrics`.
- `FixedWindowLimiterStateEnum`, `SlidingWindowLimiterStateEnum` and `RateLimiterStateEnum` describe the stored policy state and are exported from `eridu-tech/rate-limiter/contracts`.
