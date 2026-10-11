import { ExecutionContext } from "eridu-tech/execution-context";
import { AlsExecutionContextAdapter } from "eridu-tech/execution-context/als-execution-context-adapter";
import { TransactionContextResolver } from "eridu-tech/transaction-context";
import { KyselyTransactionAdapter } from "eridu-tech/transaction-context/kysely-transaction-adapter";
import Sqlite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";

type Adapters = "primary" | "secondary";

const primaryDatabase = new Kysely<any>({
    dialect: new SqliteDialect({ database: new Sqlite(":memory:") }),
});
const secondaryDatabase = new Kysely<any>({
    dialect: new SqliteDialect({ database: new Sqlite(":memory:") }),
});
const executionContext = new ExecutionContext(new AlsExecutionContextAdapter());

export const transactionContextResolver = new TransactionContextResolver<Adapters>({
    adapters: {
        primary: new KyselyTransactionAdapter({ database: primaryDatabase }),
        secondary: new KyselyTransactionAdapter({ database: secondaryDatabase }),
    },
    defaultAdapter: "primary",
    executionContext,
});

await transactionContextResolver.init();
