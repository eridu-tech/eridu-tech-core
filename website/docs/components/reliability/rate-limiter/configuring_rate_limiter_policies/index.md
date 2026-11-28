---
sidebar_position: 4
sidebar_label: Configuring policies
pagination_label: Configuring RateLimiter policies
---

# Configuring RateLimiter policies

Every adapter takes a `rateLimiterPolicy` setting. The `type` field selects the policy and the remaining fields configure it. Import `LIMITER_POLICIES` from `eridu-tech/rate-limiter/contracts`.

The limit itself is passed per call when you create a rate limiter:

```ts
rateLimiter.create("key", { limit: 5 });
```

## FixedWindowLimiter

The fixed-window policy counts attempts within a single fixed-length window.

```ts file=./samples/fixed-window-limiter.ts

```

## SlidingWindowLimiter

The sliding-window policy counts attempts per window and weights the previous one.

```ts file=./samples/sliding-window-limiter.ts

```

## Further information

For further information refer to [`eridu-tech/rate-limiter`](https://eridu-tech.github.io/eridu-tech-core/modules/RateLimiter.html) API docs.
