import { KyselyCacheAdapter } from "eridu-tech/cache/kysely-cache-adapter";
import { Pool } from "pg";
import { Kysely, PostgresDialect } from "kysely";
import {
    createTransactionContext,
    serde,
} from "./kysely-cache-adapter-setup.js";

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
const kyselyCacheAdapter = new KyselyCacheAdapter({
    transactionContext,
    serde,
});

// You need initialize the adapter once before using it.
// During the initialization the schema will be created
await kyselyCacheAdapter.init();
