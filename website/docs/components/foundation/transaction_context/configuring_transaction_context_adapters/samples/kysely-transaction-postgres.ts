import { KyselyTransactionAdapter } from "eridu-tech/transaction-context/kysely-transaction-adapter";
import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";

export const database = new Kysely<any>({
    dialect: new PostgresDialect({
        pool: new Pool({
            database: "DATABASE_NAME",
            host: "DATABASE_HOST",
            user: "DATABASE_USER",
            // DATABASE port
            port: 5432,
            password: "DATABASE_PASSWORD",
            max: 10,
        }),
    }),
});

export const kyselyTransactionAdapter = new KyselyTransactionAdapter({
    database,
});
