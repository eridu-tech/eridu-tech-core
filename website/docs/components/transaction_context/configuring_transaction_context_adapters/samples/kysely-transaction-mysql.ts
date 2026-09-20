import { KyselyTransactionAdapter } from "eridu-tech/transaction-context/kysely-transaction-adapter";
import { createPool } from "mysql2";
import { Kysely, MysqlDialect } from "kysely";

const database = new Kysely<any>({
    dialect: new MysqlDialect({
        pool: createPool({
            host: "DATABASE_HOST",
            // Database port
            port: 3306,
            database: "DATABASE_NAME",
            user: "DATABASE_USER",
            password: "DATABASE_PASSWORD",
            connectionLimit: 10,
        }),
    }),
});

export const kyselyTransactionAdapter = new KyselyTransactionAdapter({
    database,
});
