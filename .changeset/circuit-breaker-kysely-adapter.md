---
"eridu-tech": minor
---

Add the Kysely circuit breaker adapter at `eridu-tech/circuit-breaker/kysely-circuit-breaker-adapter`.

- `KyselyCircuitBreakerAdapter` stores the consecutive, count or sampling breaker state in a `circuitBreaker` table (`KyselyCircuitBreakerAdapterSettings` takes a transaction-aware `Kysely` instance and applies the configured `backoffPolicy` and `circuitBreakerPolicy`). Export `KyselyCircuitBreakerTables` from the same subpath to type the table.
- The adapter implements `IAsyncInitizable` and `IAsyncDeinitizable`: call `init()` once to create the table, and `deInit()` to remove it.
- Every operation is a single `insert ... on conflict ... returning` statement and never starts a transaction of its own; it joins the ambient transaction of the given `database`. The adapter has been tested with `sqlite` and `postgres`.
