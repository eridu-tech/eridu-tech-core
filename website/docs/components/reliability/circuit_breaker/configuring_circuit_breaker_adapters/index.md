---
sidebar_position: 3
sidebar_label: Configuring adapters
pagination_label: Configuring CircuitBreaker adapters
tags:
    - CircuitBreaker
    - Configuring adapters
    - In-memory
    - Mongodb
    - Redis
    - Kysely
    - Sqlite
    - Postgres
    - NoOp
keywords:
    - CircuitBreaker
    - Configuring adapters
    - In-memory
    - Mongodb
    - Redis
    - Kysely
    - Sqlite
    - Postgres
    - NoOp
---

# Configuring CircuitBreaker adapters

## RedisCircuitBreakerAdapter

To use the `RedisCircuitBreakerAdapter`, you'll need to:

1. Install the required dependency: [`ioredis`](https://www.npmjs.com/package/ioredis) package.

### Setup

Connect to Redis:

```ts file=./samples/redis-circuit-breaker-adapter-setup.ts

```

### Usage

Create the adapter:

```ts file=./samples/redis-circuit-breaker-adapter.ts

```

### Configuring backoff policy

The `type` field is the only required field. All other fields are optional.

```ts file=./samples/redis-circuit-breaker-backoff-policy.ts

```

The settings are the same as [backoff policies](/docs/components/utilities/backoff_policies) settings.

### Configuring CircuitBreaker policy

The `type` field is the only required field. All other fields are optional.

```ts file=./samples/redis-circuit-breaker-policy.ts

```

The settings are the same as [circuit-breaker policies](/docs/components/reliability/circuit_breaker/configuring_circuit_breaker_policies) settings.

## MemoryCircuitBreakerAdapter {#memory_circuit_breaker_adapter}

The `MemoryCircuitBreakerAdapter` owns its storage, so it needs no external dependency:

```ts file=./samples/memory-circuit-breaker-adapter.ts

```

:::info
`MemoryCircuitBreakerAdapter` lets you test your app without external dependencies like `Redis`, ideal for local development, unit tests, integration tests and fast E2E test for the backend application.
:::

The adapter implements `IDeinitizable`: call `deInit()` to clear the stored state. State lives in the current process, so it is shared neither between processes nor across restarts.

### Configuring policies

```ts file=./samples/memory-circuit-breaker-policy.ts

```

## MongodbCircuitBreakerAdapter {#mongodb_circuit_breaker_adapter}

To use the `MongodbCircuitBreakerAdapter`, you'll need to:

1. Use a database provider that has support for transactions.
2. Install the required dependency: [`mongodb`](https://www.npmjs.com/package/mongodb) package.

### Setup

Connect to MongoDB and wrap the `Db` instance in a [`TransactionContext`](/docs/components/foundation/transaction_context/transaction_context_usage) using a [`MongodbTransactionAdapter`](/docs/components/foundation/transaction_context/configuring_transaction_context_adapters/#mongodb_transaction_adapter):

```ts file=./samples/mongodb-circuit-breaker-adapter-setup.ts

```

:::info
The `database` setting makes the adapter transaction aware. Adapters given the same instance share the same transaction when available.
:::

### Usage

```ts file=./samples/mongodb-circuit-breaker-adapter.ts

```

The adapter stores its state in the `circuitBreaker` collection, change it with `collectionName`. Every operation is a single MongoDB call, and the adapter joins the ambient transaction of the given `database` instead of starting one.

## KyselyCircuitBreakerAdapter {#kysely_circuit_breaker_adapter}

To use the `KyselyCircuitBreakerAdapter`, you'll need to:

1. Use a database provider that has support for transactions.
2. Install the required dependency: [`kysely`](https://www.npmjs.com/package/kysely) package.

### Setup

```ts file=./samples/kysely-circuit-breaker-adapter-setup.ts

```

:::info
The `database` setting takes either a `Kysely` instance or an `ITransactionContext`. A plain `Kysely` instance is wrapped in a no-op transaction context, and passing a `TransactionContext` makes the adapter join its active transaction.
:::

The adapter implements `IAsyncInitizable` and `IAsyncDeinitizable`: call `init()` once to create the `circuitBreaker` table, and `deInit()` to remove it.

### With Sqlite

You will need to install [`better-sqlite3`](https://www.npmjs.com/package/better-sqlite3) package:

```ts file=./samples/kysely-circuit-breaker-adapter-sqlite.ts

```

### With Postgres

You will need to install [`pg`](https://www.npmjs.com/package/pg) package:

```ts file=./samples/kysely-circuit-breaker-adapter-postgres.ts

```

Type the database with `KyselyCircuitBreakerTables` from `eridu-tech/circuit-breaker/kysely-circuit-breaker-adapter` to get full type safety on the `circuitBreaker` table.

## NoOpCircuitBreakerAdapter

The `NoOpCircuitBreakerAdapter` is a no-operation implementation, it performs no actions when called:

```ts file=./samples/no-op-circuit-breaker-adapter.ts

```

:::info
The `NoOpCircuitBreakerAdapter` is useful when you want to mock out or disable your [`CircuitBreakerFactory`](https://eridu-tech.github.io/eridu-tech-core/classes/CircuitBreaker.CircuitBreakerFactory.html) instance.
:::

## Further information

For further information refer to [`eridu-tech/circuit-breaker`](https://eridu-tech.github.io/eridu-tech-core/modules/CircuitBreaker.html) API docs.
