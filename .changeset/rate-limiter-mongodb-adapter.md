---
"eridu-tech": minor
---

Add the MongoDB rate limiter adapter at `eridu-tech/rate-limiter/mongodb-rate-limiter-adapter`.

- `MongdobRateLimiter` stores the fixed-window or sliding-window state in a MongoDB collection (`MongodbRateLimiterSettings` takes a transaction-aware `database`, an optional `collectionName` and optional `collectionSettings`) and applies the configured `backoffPolicy` and `rateLimiterPolicy`.
- The adapter implements `IAsyncInitizable` and `IAsyncDeinitizable`: call `init()` once to create the `key` and `expiration` indexes, and `deInit()` to remove the collection.
- Every operation is a single MongoDB call and never starts a transaction of its own; it joins the ambient transaction of the given `database`.
