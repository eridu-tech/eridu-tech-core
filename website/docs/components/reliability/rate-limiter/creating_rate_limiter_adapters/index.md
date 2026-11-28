---
sidebar_position: 5
sidebar_label: Creating adapters
pagination_label: Creating RateLimiter adapters
tags:
    - RateLimiter
    - Creating adapters
keywords:
    - RateLimiter
    - Creating adapters
---

# Creating RateLimiter adapters

## Implementing your custom IRateLimiterAdapter

In order to create an adapter you need to implement the [`IRateLimiterAdapter`](https://eridu-tech.github.io/eridu-tech-core/types/RateLimiter.IRateLimiterAdapter.html) contract.

Every adapter owns its own persistence. There is no storage-adapter plug-in point: an adapter that needs external storage creates its schema in `init()` and removes it in `deInit()`, and applies the `backoffPolicy` and `rateLimiterPolicy` settings internally.

```ts file=./samples/custom-rate-limiter-adapter.ts

```

## Implementing your custom rate-limiter factory class

In some cases, you may need to implement a custom [`RateLimiterFactory`](https://eridu-tech.github.io/eridu-tech-core/classes/RateLimiter.RateLimiterFactory.html) class to optimize performance for your specific technology stack. You can then directly implement the [`IRateLimiterFactory`](https://eridu-tech.github.io/eridu-tech-core/types/RateLimiter.IRateLimiterFactory.html) contract.

## Further information

For further information refer to [`eridu-tech/rate-limiter`](https://eridu-tech.github.io/eridu-tech-core/modules/RateLimiter.html) API docs.
