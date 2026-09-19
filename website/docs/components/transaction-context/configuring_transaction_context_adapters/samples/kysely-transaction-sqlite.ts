import { KyselyTransactionAdapter } from "eridu-tech/transaction-context/kysely-transaction-adapter";
import Sqlite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";

const database = new Kysely<any>({
    dialect: new SqliteDialect({
        database: new Sqlite(":memory:"),
    }),
});

export const kyselyTransactionAdapter = new KyselyTransactionAdapter({
    database,
});
