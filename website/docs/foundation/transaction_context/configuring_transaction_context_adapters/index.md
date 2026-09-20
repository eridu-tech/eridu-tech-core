---
sidebar_position: 2
sidebar_label: Configuring adapters
pagination_label: Configuring TransactionContext adapters
tags:
    - TransactionContext
    - Configuring adapters
    - Mongodb
    - Kysely
    - Sqlite
    - Mysql
    - Postgres
    - Libsql
    - NoOp
keywords:
    - TransactionContext
    - Configuring adapters
    - Mongodb
    - Kysely
    - Sqlite
    - Mysql
    - Postgres
    - Libsql
    - NoOp
---

# Configuring TransactionContext adapters

## KyselyTransactionAdapter {#kysely_transaction_adapter}

To use the `KyselyTransactionAdapter`, you'll need to install the required dependency: [`kysely`](https://www.npmjs.com/package/kysely) package.

### Usage with Sqlite

You will need to install [`better-sqlite3`](https://www.npmjs.com/package/better-sqlite3) package:

```ts file=./samples/kysely-transaction-sqlite.ts

```

### Usage with Postgres

You will need to install [`pg`](https://www.npmjs.com/package/pg) package:

```ts file=./samples/kysely-transaction-postgres.ts

```

### Usage with Mysql

You will need to install [`mysql2`](https://www.npmjs.com/package/mysql2) package. The same setup applies to MariaDB, by using [`MysqlDialect`](https://kysely-org.github.io/kysely-apidoc/classes/MysqlDialect.html):

```ts file=./samples/kysely-transaction-mysql.ts

```

### Usage with Libsql

You will need to install [`@libsql/kysely-libsql`](https://www.npmjs.com/package/@libsql/kysely-libsql) package:

```ts file=./samples/kysely-transaction-libsql.ts

```

### Usage with other databases

Note [`kysely`](https://www.npmjs.com/package/kysely) has support for multiple [databases](https://github.com/kysely-org/awesome-kysely?tab=readme-ov-file#dialects).

:::danger
Before choosing a database, ensure it supports transactions. Without transaction support,
starting a transaction fails and a `StartTransactionError` is thrown.
:::

### Settings

```ts file=./samples/kysely-transaction-adapter-settings.ts

```

:::info
Kysely's SQLite driver ignores the configured access mode and isolation level, because SQLite
does not support them. Other dialects apply both settings to every new transaction.
:::

### Usage with TransactionContext

Pass the adapter to the `TransactionContext` class, then read `current` to get the client of the current scope. Inside `run()` it is the transaction-scoped client, outside of it the base client:

```ts file=./samples/kysely-transaction-context.ts

```

## MongodbTransactionAdapter {#mongodb_transaction_adapter}

To use the `MongodbTransactionAdapter`, you'll need to install the required dependency: [`mongodb`](https://www.npmjs.com/package/mongodb) package.

The `client` setting is the `MongoClient` used to start sessions and transactions, while `database` is the `Db` instance exposed as the base (non-transactional) client:

```ts file=./samples/mongodb-transaction-adapter.ts

```

:::danger
MongoDB only supports transactions on replica sets and sharded clusters. Standalone deployments
will fail as soon as an operation runs inside a transaction.
:::

### Settings

```ts file=./samples/mongodb-transaction-adapter-settings.ts

```

:::info
Every transaction commits or aborts on its own session, and the session is always ended
afterwards — even when committing or aborting fails.
:::

### Usage with TransactionContext

MongoDB scopes a transaction to a `ClientSession`, so read `transaction` to get the session of the active transaction and pass it to the operations that must join it. `client` always stays the base database, which must not be used for transactional work:

```ts file=./samples/mongodb-transaction-context.ts

```

## Further information

For further information refer to [`eridu-tech/transaction-context`](https://eridu-tech.github.io/eridu-tech-core/modules/TransactionContext.html) API docs.
