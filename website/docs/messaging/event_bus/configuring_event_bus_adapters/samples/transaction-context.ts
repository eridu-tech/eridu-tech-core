import { ExecutionContext } from "eridu-tech/execution-context";
import { AlsExecutionContextAdapter } from "eridu-tech/execution-context/als-execution-context-adapter";
import { contextToken } from "eridu-tech/execution-context/contracts";
import { TransactionContext } from "eridu-tech/transaction-context";
import { KyselyTransactionAdapter } from "eridu-tech/transaction-context/kysely-transaction-adapter";
import Sqlite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";

const database = new Kysely<any>({
    dialect: new SqliteDialect({
        database: new Sqlite("DATABASE_NAME.db"),
    }),
});

export const transactionContext = new TransactionContext<Kysely<any>>({
    // The token the active transaction is stored under
    token: contextToken("sqlite-transaction"),

    // You can choose the adapter to use
    adapter: new KyselyTransactionAdapter({ database }),

    // The execution context that tracks the active transaction across scopes
    executionContext: new ExecutionContext(new AlsExecutionContextAdapter()),
});
