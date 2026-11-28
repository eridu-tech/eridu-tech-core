---
sidebar_position: 3
sidebar_label: Configuring adapters
pagination_label: Configuring RateLimiter adapters
tags:
    - RateLimiter
    - Configuring adapters
    - In-memory
    - Mongodb
    - Redis
    - Kysely
    - Sqlite
    - Postgres
    - NoOp
keywords:
    - RateLimiter
    - Configuring adapters
    - In-memory
    - Mongodb
    - Redis
    - Kysely
    - Sqlite
    - Postgres
    - NoOp
---

# Configuring RateLimiter adapters

## RedisRateLimiterAdapter

To use the `RedisRateLimiterAdapter`, you'll need to:

1. Install the required dependency: [`ioredis`](https://www.npmjs.com/package/ioredis) package.

### Setup

Connect to Redis:

```ts file=./samples/redis-rate-limiter-adapter-setup.ts

```

### Usage

Create the adapter:

```ts file=./samples/redis-rate-limiter-adapter.ts

```

### Configuring backoff policy

The `type` field is the only required field. All other fields are optional.

```ts file=./samples/redis-rate-limiter-backoff-policy.ts

```

The settings are the same as [backoff policies](/docs/components/utilities/backoff_policies) settings.

### Configuring RateLimiter policy

The `type` field is the only required field. All other fields are optional.

```ts file=./samples/redis-rate-limiter-policy.ts

```

The settings are the same as [rate-limiter policies](/docs/components/reliability/rate-limiter/configuring_rate_limiter_policies) settings.

## MemoryRateLimiterAdapter {#memory_rate_limiter_adapter}

The `MemoryRateLimiterAdapter` owns its storage, so it needs no external dependency:

```ts file=./samples/memory-rate-limiter-adapter.ts

```

:::info
`MemoryRateLimiterAdapter` lets you test your app without external dependencies like `Redis`, ideal for local development, unit tests, integration tests and fast E2E test for the backend application.
:::

The adapter implements `IDeinitizable` and `IPrunable`: `deInit()` clears the stored state and `removeAllExpired()` removes expired records synchronously. State lives in the current process, so it is shared neither between processes nor across restarts.

### Configuring policies

```ts file=./samples/memory-rate-limiter-policy.ts

```

### Removing expired records

Call `removeAllExpired` at a regular interval (for example, using a cron job) to clean up expired rate-limiter records:

```ts file=./samples/memory-rate-limiter-remove-all-expired.ts

```

## MongodbRateLimiterAdapter {#mongodb_rate_limiter_adapter}

To use the `MongdobRateLimiter`, you'll need to:

1. Use a database provider that has support for transactions.
2. Install the required dependency: [`mongodb`](https://www.npmjs.com/package/mongodb) package.

### Setup

Connect to MongoDB and wrap the `Db` instance in a [`TransactionContext`](/docs/components/foundation/transaction_context/transaction_context_usage) using a [`MongodbTransactionAdapter`](/docs/components/foundation/transaction_context/configuring_transaction_context_adapters/#mongodb_transaction_adapter):

```ts file=./samples/mongodb-rate-limiter-adapter-setup.ts

```

:::info
The `database` setting makes the adapter transaction aware. Adapters given the same instance share the same transaction when available.
:::

### Usage

```ts file=./samples/mongodb-rate-limiter-adapter.ts

```

The adapter stores its state in the `rateLimiter` collection, change it with `collectionName`. Every operation is a single MongoDB call, and the adapter joins the ambient transaction of the given `database` instead of starting one.

## KyselyRateLimiterAdapter {#kysely_rate_limiter_adapter}

To use the `KyselyRateLimiterAdapter`, you'll need to:

1. Use a database provider that has support for transactions.
2. Install the required dependency: [`kysely`](https://www.npmjs.com/package/kysely) package.

### Setup

```ts file=./samples/kysely-rate-limiter-adapter-setup.ts

```

:::info
The `database` setting takes either a `Kysely` instance or an `ITransactionContext`. A plain `Kysely` instance is wrapped in a no-op transaction context, and passing a `TransactionContext` makes the adapter join its active transaction.
:::

The adapter implements `IAsyncInitizable`, `IAsyncDeinitizable` and `IAsyncPrunable`: call `init()` once to create the `rateLimiter` table and its expiration index, `deInit()` to drop them, and `removeAllExpired()` to delete expired entries.

### With Sqlite

You will need to install [`better-sqlite3`](https://www.npmjs.com/package/better-sqlite3) package:

```ts file=./samples/kysely-rate-limiter-adapter-sqlite.ts

```

### With Postgres

You will need to install [`pg`](https://www.npmjs.com/package/pg) package:

```ts file=./samples/kysely-rate-limiter-adapter-postgres.ts

```

Type the database with `KyselyRateLimiterTables` from `eridu-tech/rate-limiter/kysely-rate-limiter-adapter` to get full type safety on the `rateLimiter` table.

### Removing expired records

```ts file=./samples/kysely-rate-limiter-remove-all-expired.ts

```

## NoOpRateLimiterAdapter

The `NoOpRateLimiterAdapter` is a no-operation implementation, it performs no actions when called:

```ts file=./samples/no-op-rate-limiter-adapter.ts

```

:::info
The `NoOpRateLimiterAdapter` is useful when you want to mock out or disable your [`RateLimiterFactory`](https://eridu-tech.github.io/eridu-tech-core/classes/RateLimiter.RateLimiterFactory.html) instance.
:::

## Further information

For further information refer to [`eridu-tech/rate-limiter`](https://eridu-tech.github.io/eridu-tech-core/modules/RateLimiter.html) API docs.
