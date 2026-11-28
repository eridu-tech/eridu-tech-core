import { KyselyCircuitBreakerAdapter } from "eridu-tech/circuit-breaker/kysely-circuit-breaker-adapter";
import Sqlite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import { createTransactionContext } from "./kysely-circuit-breaker-adapter-setup.js";
import type { KyselyCircuitBreakerTables } from "eridu-tech/circuit-breaker/kysely-circuit-breaker-adapter";

const database = new Sqlite("DATABASE_NAME.db");
const kysely = new Kysely<KyselyCircuitBreakerTables>({
    dialect: new SqliteDialect({
        database,
    }),
});
const transactionContext = createTransactionContext(kysely);
export const kyselyCircuitBreakerAdapter = new KyselyCircuitBreakerAdapter({
    database: transactionContext,
});

// You need to initialize the adapter once before using it.
// During the initialization the `circuitBreaker` table is created.
await kyselyCircuitBreakerAdapter.init();
