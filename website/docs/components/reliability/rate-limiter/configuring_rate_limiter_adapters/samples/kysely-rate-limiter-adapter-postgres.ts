import { KyselyRateLimiterAdapter } from "eridu-tech/rate-limiter/kysely-rate-limiter-adapter";
import { Pool } from "pg";
import { Kysely, PostgresDialect } from "kysely";
import { createTransactionContext } from "./kysely-rate-limiter-adapter-setup.js";
import type { KyselyRateLimiterTables } from "eridu-tech/rate-limiter/kysely-rate-limiter-adapter";

const database = new Pool({
    database: "DATABASE_NAME",
    host: "DATABASE_HOST",
    user: "DATABASE_USER",
    // DATABASE port
    port: 5432,
    password: "DATABASE_PASSWORD",
    max: 10,
});
const kysely = new Kysely<KyselyRateLimiterTables>({
    dialect: new PostgresDialect({
        pool: database,
    }),
});
const transactionContext = createTransactionContext(kysely);
export const kyselyRateLimiterAdapter = new KyselyRateLimiterAdapter({
    database: transactionContext,
});

// You need to initialize the adapter once before using it.
// During the initialization the `rateLimiter` table and its expiration index are created.
await kyselyRateLimiterAdapter.init();
