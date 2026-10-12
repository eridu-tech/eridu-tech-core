import { KyselyTransactionAdapter } from "eridu-tech/transaction-context/kysely-transaction-adapter";
import { sqliteDatabase } from "./sqlite-database.js";

export const sqliteTransactionAdapter = new KyselyTransactionAdapter({
    database: sqliteDatabase,
});
