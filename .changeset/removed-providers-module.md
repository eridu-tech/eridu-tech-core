---
"eridu-tech": minor
---

Removed the `providers` module and its `eridu-tech/providers/*` package exports.

The module bundled dependency-injection aware service providers for the MongoDB, MySQL, PostgreSQL, Redis and SQLite clients, plus the Kysely providers layered on top of them. The container service-provider pattern they were built on turned out to be insufficient and too constrained to scale: it was not flexible enough to describe how applications actually wire their infrastructure, and it made the DI container glue code hard to maintain. The providers and the container API they relied on are gone.

- Removed the `eridu-tech/providers/mongodb-provider`, `eridu-tech/providers/mysql-provider`, `eridu-tech/providers/postgres-provider`, `eridu-tech/providers/redis-provider` and `eridu-tech/providers/sqlite-provider` entry points, along with their `mongodbProvider` / `mysqlProvider` / `postgresProvider` / `redisProvider` / `sqliteProvider` functions, their `MONGODB_CLIENT` / `MYSQL_CLIENT` / `POSTGRES_CLIENT` / `REDIS_CLIENT` / `SQLITE_CLIENT` tokens and their settings types.
- Removed the `eridu-tech/providers/kysely-mysql-provider`, `eridu-tech/providers/kysely-postgres-provider` and `eridu-tech/providers/kysely-sqlite-provider` entry points, along with their `kyselyMysqlProvider` / `kyselyPostgresProvider` / `kyselySqliteProvider` functions, their `KYSELY_MYSQL` / `KYSELY_POSTGRES` / `KYSELY_SQLITE` tokens and their settings types.

### Breaking changes

- Removed the container service-provider registration API: `Container.registerProvider`, `IServiceRegister.registerProvider`, `ServiceProviderFn`, `IServiceProvider` and `IServiceProviderRegister`.
- Removed every `eridu-tech/providers/*` package export listed above, so imports from the `providers` module no longer resolve.

### Migration

Register the client yourself with `registerFactory` and move the work the provider used to do into the per-registration `onInit` / `onDeInit` hooks:

**Before:**

```ts
import { Container } from "eridu-tech/di";
import {
    sqliteProvider,
    SQLITE_CLIENT,
} from "eridu-tech/providers/sqlite-provider";

const container = new Container({ executionContext });

container.registerProvider(sqliteProvider({ filename: ":memory:" }));

await container.init();
await container.deInit();
```

**After:**

```ts
import Sqlite, { type Database } from "better-sqlite3";
import { Container } from "eridu-tech/di";
import { genericToken, LIFETIME } from "eridu-tech/di/contracts";

const SQLITE_CLIENT = genericToken<Database>("SQLITE_CLIENT");

const container = new Container({ executionContext });

container.registerFactory({
    token: SQLITE_CLIENT,
    deps: {},
    factory: () => new Sqlite(":memory:"),
    lifetime: LIFETIME.SINGLETON,
    onInit: (client) => {
        client.pragma("journal_mode = WAL");
    },
    onDeInit: (client) => {
        client.close();
    },
});

await container.init();
await container.deInit();
```
