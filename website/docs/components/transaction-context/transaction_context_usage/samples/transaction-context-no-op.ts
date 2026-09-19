import { TransactionContext } from "eridu-tech/transaction-context";
import Sqlite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";

const database = new Kysely<any>({
    dialect: new SqliteDialect({
        database: new Sqlite("DATABASE_NAME.db"),
    }),
});

// A context that never uses transactions:
// `run()` invokes its invocable directly and `afterCommit()` hooks run immediately
export const noOpTransactionContext = TransactionContext.noOp(database);
