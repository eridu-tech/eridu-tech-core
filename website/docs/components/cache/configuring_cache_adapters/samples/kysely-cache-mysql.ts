import { KyselyCacheAdapter } from "eridu-tech/cache/kysely-cache-adapter";
import { createPool } from "mysql2";
import { Kysely, MysqlDialect } from "kysely";
import {
    createTransactionContext,
    serde,
} from "./kysely-cache-adapter-setup.js";

const database = createPool({
    host: "DATABASE_HOST",
    // Database port
    port: 3306,
    database: "DATABASE_NAME",
    user: "DATABASE_USER",
    password: "DATABASE_PASSWORD",
    connectionLimit: 10,
});
const kysely = new Kysely<any>({
    dialect: new MysqlDialect({
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
