---
"eridu-tech": minor
---

Added dependency-injection aware service providers for the MongoDB, MySQL, PostgreSQL, Redis and SQLite clients, plus Kysely providers for MySQL, PostgreSQL and SQLite.

Every provider registers its client as a singleton in the container and wires the container lifecycle to it: initialization-time setup runs during `container.init()` and the client is closed during `container.deInit()`. The Kysely providers take the driver token as a dependency instead of creating the client themselves, so they layer on top of the client providers:

```ts
import { sql } from "kysely";
import { Container } from "eridu-tech/di";
import {
    kyselySqliteProvider,
    KYSELY_SQLITE,
} from "eridu-tech/providers/kysely-sqlite-provider";
import {
    sqliteProvider,
    SQLITE_CLIENT,
} from "eridu-tech/providers/sqlite-provider";

const container = new Container({ executionContext });

container.registerProvider(sqliteProvider({ filename: ":memory:" }));
container.registerProvider(
    kyselySqliteProvider({ sqliteToken: SQLITE_CLIENT }),
);

await container.init();

const kysely = await container.resolveOrFail(KYSELY_SQLITE);
await sql`select 1 as value`.execute(kysely);

await container.deInit();
```

- `eridu-tech/providers/mongodb-provider` exports `mongodbProvider`, the `MONGODB_CLIENT` token and the `MongodbProviderSettings` type.
- `eridu-tech/providers/mysql-provider` exports `mysqlProvider`, the `MYSQL_CLIENT` token and the `MysqlProviderSettings` type.
- `eridu-tech/providers/postgres-provider` exports `postgresProvider`, the `POSTGRES_CLIENT` token and the `PostgresProviderSettings` type.
- `eridu-tech/providers/redis-provider` exports `redisProvider`, the `REDIS_CLIENT` token and the `RedisSettings` type.
- `eridu-tech/providers/sqlite-provider` exports `sqliteProvider`, the `SQLITE_CLIENT` token and the `SqliteProviderSettings` type.
- `eridu-tech/providers/kysely-mysql-provider` exports `kyselyMysqlProvider`, the `KYSELY_MYSQL` token and the `KyselyMysqlProviderSettings`/`KyselyMysqlDialectSettings` types.
- `eridu-tech/providers/kysely-postgres-provider` exports `kyselyPostgresProvider`, the `KYSELY_POSTGRES` token and the `KyselyPostgresProviderSettings`/`KyselyPostgresDialectSettings` types.
- `eridu-tech/providers/kysely-sqlite-provider` exports `kyselySqliteProvider`, the `KYSELY_SQLITE` token and the `KyselySqliteProviderSettings`/`KyselySqliteDialectSettings` types.

### Details

- `sqliteProvider`, `postgresProvider` and `mysqlProvider` accept an optional `onInit` callback that receives the connected client, so pragmas, migrations or other one-time setup can run during `container.init()`.
- `mongodbProvider` connects during `container.init()` by default; set `eagerConnect: false` to connect lazily on the first operation instead.
- `redisProvider` connects lazily on first use and only closes the connection during `container.deInit()`.
- The Kysely providers accept either a `KyselyConfig` or a `KyselyProps` shape (minus `dialect`), so plugins and logging can be configured, and expose a `dialectSettings` option for the remaining dialect options.
