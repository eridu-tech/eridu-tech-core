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

const executionContext = new ExecutionContext(new AlsExecutionContextAdapter());

export const transactionContext = new TransactionContext<Kysely<any>>({
    token: contextToken("transaction"),
    adapter: new KyselyTransactionAdapter({ database }),
    executionContext,
});
