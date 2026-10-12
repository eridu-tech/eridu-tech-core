import { contextToken } from "eridu-tech/execution-context/contracts";
import { TransactionContext } from "eridu-tech/transaction-context";
import { KyselyTransactionAdapter } from "eridu-tech/transaction-context/kysely-transaction-adapter";
import { executionContext } from "./execution-context.js";
import { database } from "./kysely-database.js";
import type { Kysely } from "kysely";

export const transactionContext = new TransactionContext<Kysely<any>>({
    // The token the active transaction is stored under
    token: contextToken("sqlite-transaction"),

    // You can choose the adapter to use
    adapter: new KyselyTransactionAdapter({ database }),

    // The execution context that tracks the active transaction across scopes
    executionContext,
});
