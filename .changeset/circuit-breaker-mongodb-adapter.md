---
"eridu-tech": minor
---

Add the MongoDB circuit breaker adapter at `eridu-tech/circuit-breaker/mongodb-circuit-breaker-adapter`.

- `MongodbCircuitBreakerAdapter` stores the consecutive, count or sampling breaker state in a MongoDB collection (`MongodbCircuitBreakerAdapterSettings` takes a transaction-aware `database`, an optional `collectionName` and optional `collectionSettings`) and applies the configured `backoffPolicy` and `circuitBreakerPolicy`.
- The adapter implements `IAsyncInitizable` and `IAsyncDeinitizable`: call `init()` once to create the unique `key` index, and `deInit()` to remove the collection.
- Every operation is a single MongoDB call and never starts a transaction of its own; it joins the ambient transaction of the given `database`.
