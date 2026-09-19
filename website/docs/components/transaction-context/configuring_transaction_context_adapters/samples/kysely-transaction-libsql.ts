import { KyselyTransactionAdapter } from "eridu-tech/transaction-context/kysely-transaction-adapter";
import { LibsqlDialect } from "@libsql/kysely-libsql";
import { Kysely } from "kysely";

const database = new Kysely<any>({
    dialect: new LibsqlDialect({
        url: "DATABASE_URL",
    }),
});

export const kyselyTransactionAdapter = new KyselyTransactionAdapter({
    database,
});
