---
sidebar_position: 3
sidebar_label: Configuring adapters
pagination_label: Configuring cache adapters
tags:
    - Cache
    - Configuring adapters
    - In-memory
    - Mongodb
    - Redis
    - Kysely
    - Sqlite
    - Mysql
    - Postgres
    - Sqlite
    - Libsql
    - NoOp
keywords:
    - Cache
    - Configuring adapters
    - In-memory
    - Mongodb
    - Redis
    - Kysely
    - Sqlite
    - Mysql
    - Postgres
    - Sqlite
    - Libsql
    - NoOp
---

# Configuring Cache adapters

## MemoryCacheAdapter

To use the `MemoryCacheAdapter` you only need to create instance of it:

```ts file=./samples/memory-cache-adapter.ts

```

You can also provide an `Map` that will be used for storing the data in memory:

```ts file=./samples/memory-cache-adapter-with-map.ts

```

:::info
`MemoryCacheAdapter` lets you test your app without external dependencies like `Redis`, ideal for local development, unit tests, integration tests and fast E2E test for the backend application.
:::

### Settings

To clean up expired cache keys, call `removeAllExpired` at a regular interval (for example, using a cron job):

```ts file=./samples/memory-cache-remove-all-expired.ts

```

:::info
Note `removeAllExpired` must be called to remove expired data that is no longer being used.
:::

:::info
To remove the cache map and all stored cache data, use `deInit` method:

```ts file=./samples/memory-cache-adapter-deinit.ts

```

:::

## MongodbCacheAdapter

To use the `MongodbCacheAdapter`, you'll need to:

1. Install the required dependency: [`mongodb`](https://www.npmjs.com/package/mongodb) package:

2. Provide a string serializer ([`ISerde`](/docs/components/serde)):

-We recommend using `SuperJsonSerdeAdapter` for this purpose

```ts file=./samples/mongodb-cache-adapter-init.ts

```

You can change the collection name:

```ts file=./samples/mongodb-cache-collection-name.ts

```

You can change the collection settings:

```ts file=./samples/mongodb-cache-collection-settings.ts

```

:::info
To remove the cache collection and all stored cache data, use `deInit` method:

```ts file=./samples/mongodb-cache-adapter-deinit.ts

```

:::

## RedisCacheAdapter

To use the `RedisCacheAdapter`, you'll need to:

1. Install the required dependency: [`ioredis`](https://www.npmjs.com/package/ioredis) package:
2. Provide a string serializer ([`ISerde`](/docs/components/serde)):

- We recommend using `SuperJsonSerdeAdapter` for this purpose

```ts file=./samples/redis-cache-adapter.ts

```

## KyselyCacheAdapter

To use the `KyselyCacheAdapter`, you'll need to:

1. Install the required dependency: [`kysely`](https://www.npmjs.com/package/kysely) package:
2. Provide a string serializer ([`ISerde`](/docs/components/serde)):

- We recommend using `SuperJsonSerdeAdapter` for this purpose

### Usage with Sqlite

You will need to install [`better-sqlite3`](https://www.npmjs.com/package/better-sqlite3) package:

```ts file=./samples/kysely-cache-sqlite.ts

```

### Usage with Postgres

You will need to install [`pg`](https://www.npmjs.com/package/pg) package:

```ts file=./samples/kysely-cache-postgres.ts

```

### Usage with Mysql

You will need to install [`mysql2`](https://www.npmjs.com/package/mysql2) package:

```ts file=./samples/kysely-cache-mysql.ts

```

### Usage with Libsql

You will need to install [`@libsql/kysely-libsql`](https://www.npmjs.com/package/@libsql/kysely-libsql) package:

```ts file=./samples/kysely-cache-libsql.ts

```

### Usage with other databases

Note [`kysely`](https://www.npmjs.com/package/kysely) has support for multiple [databases](https://github.com/kysely-org/awesome-kysely?tab=readme-ov-file#dialects).

:::danger
Before choose a database, ensure it supports transactions. Without transaction support,
you won't be able to use following methods `put` and `increment`, as they require transactional functionality.
:::

### Settings

To clean up expired cache keys, call `removeAllExpired` at a regular interval (for example, using a cron job):

```ts file=./samples/kysely-cache-remove-all-expired.ts

```

:::info
To remove the cache table and all stored cache data, use `deInit` method:

```ts file=./samples/kysely-cache-adapter-deinit.ts

```

:::

## NoOpCacheAdapter

The `NoOpCacheAdapter` is a no-operation implementation, it performs no actions when called:

```ts file=./samples/no-op-cache-adapter.ts

```

:::info
The `NoOpCacheAdapter` is useful when you want to mock out or disable your [`Cache`](https://eridu-tech.github.io/eridu-tech-core/classes/Cache.Cache.html) class instance.
:::

:::info
Note `NoOpCacheAdapter` returns always null when retrieving items and return true when adding, updating, and removing items.
:::

## Further information

For further information refer to [`eridu-tech/cache`](https://eridu-tech.github.io/eridu-tech-core/modules/Cache.html) API docs.
