import { KyselyRateLimiterAdapter } from "eridu-tech/rate-limiter/kysely-rate-limiter-adapter";
import Sqlite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import { createTransactionContext } from "./kysely-rate-limiter-adapter-setup.js";
import type { KyselyRateLimiterTables } from "eridu-tech/rate-limiter/kysely-rate-limiter-adapter";

const database = new Sqlite("DATABASE_NAME.db");
const kysely = new Kysely<KyselyRateLimiterTables>({
    dialect: new SqliteDialect({
        database,
    }),
});
const transactionContext = createTransactionContext(kysely);
export const kyselyRateLimiterAdapter = new KyselyRateLimiterAdapter({
    database: transactionContext,
});

// You need to initialize the adapter once before using it.
// During the initialization the `rateLimiter` table and its expiration index are created.
await kyselyRateLimiterAdapter.init();
