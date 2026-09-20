import { KyselySemaphoreAdapter } from "eridu-tech/semaphore/kysely-semaphore-adapter";
import { Pool } from "pg";
import { Kysely, PostgresDialect } from "kysely";
import { createTransactionContext } from "./kysely-semaphore-adapter-setup.js";

const database = new Pool({
    database: "DATABASE_NAME",
    host: "DATABASE_HOST",
    user: "DATABASE_USER",
    // DATABASE port
    port: 5432,
    password: "DATABASE_PASSWORD",
    max: 10,
});
const kysely = new Kysely<any>({
    dialect: new PostgresDialect({
        pool: database,
    }),
});
const transactionContext = createTransactionContext(kysely);
const kyselySemaphoreAdapter = new KyselySemaphoreAdapter({
    transactionContext,
});

// You need initialize the adapter once before using it.
// During the initialization the schema will be created
await kyselySemaphoreAdapter.init();
