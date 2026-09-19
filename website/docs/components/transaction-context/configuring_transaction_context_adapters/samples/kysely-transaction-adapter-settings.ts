import { KyselyTransactionAdapter } from "eridu-tech/transaction-context/kysely-transaction-adapter";
import { database } from "./kysely-transaction-postgres.js";

export const kyselyTransactionAdapter = new KyselyTransactionAdapter({
    database,

    // Applied to every new transaction
    // This is the default value
    accessMode: "read write",

    // Applied to every new transaction
    // This is the default value
    isolationLevel: "serializable",
});
