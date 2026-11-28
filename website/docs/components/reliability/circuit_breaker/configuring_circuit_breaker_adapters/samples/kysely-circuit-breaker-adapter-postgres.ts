import { KyselyCircuitBreakerAdapter } from "eridu-tech/circuit-breaker/kysely-circuit-breaker-adapter";
import { Pool } from "pg";
import { Kysely, PostgresDialect } from "kysely";
import { createTransactionContext } from "./kysely-circuit-breaker-adapter-setup.js";
import type { KyselyCircuitBreakerTables } from "eridu-tech/circuit-breaker/kysely-circuit-breaker-adapter";

const database = new Pool({
    database: "DATABASE_NAME",
    host: "DATABASE_HOST",
    user: "DATABASE_USER",
    // DATABASE port
    port: 5432,
    password: "DATABASE_PASSWORD",
    max: 10,
});
const kysely = new Kysely<KyselyCircuitBreakerTables>({
    dialect: new PostgresDialect({
        pool: database,
    }),
});
const transactionContext = createTransactionContext(kysely);
export const kyselyCircuitBreakerAdapter = new KyselyCircuitBreakerAdapter({
    database: transactionContext,
});

// You need to initialize the adapter once before using it.
// During the initialization the `circuitBreaker` table is created.
await kyselyCircuitBreakerAdapter.init();
