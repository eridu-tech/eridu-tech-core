import { ExecutionContext } from "eridu-tech/execution-context";
import { AlsExecutionContextAdapter } from "eridu-tech/execution-context/als-execution-context-adapter";
import { TransactionContextResolver } from "eridu-tech/transaction-context";
import { KyselyTransactionAdapter } from "eridu-tech/transaction-context/kysely-transaction-adapter";
import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import Sqlite from "better-sqlite3";
import { SqliteDialect } from "kysely";

const postgresDatabase = new Kysely<any>({
    dialect: new PostgresDialect({
        pool: new Pool({
            database: "DATABASE_NAME",
            host: "DATABASE_HOST",
            user: "DATABASE_USER",
            // DATABASE port
            port: 5432,
            password: "DATABASE_PASSWORD",
        }),
    }),
});

const executionContext = new ExecutionContext(new AlsExecutionContextAdapter());

const sqliteDatabase = new Kysely<any>({
    dialect: new SqliteDialect({
        database: new Sqlite("local.db"),
    }),
});

const transactionContextResolver = new TransactionContextResolver({
    adapters: {
        postgres: new KyselyTransactionAdapter({ database: postgresDatabase }),
        sqlite: new KyselyTransactionAdapter({ database: sqliteDatabase }),
    },
    executionContext,
});
await transactionContextResolver.init();

async function publishUserCreatedEvent(userId: string): Promise<void> {
    // ...
}

// No wrapped context is in a transaction, so the hook runs immediately
await transactionContextResolver.afterCommit(() =>
    publishUserCreatedEvent("1"),
);

// Only the postgres context is in a transaction, so the hook is registered on
// it and runs once that transaction commits
await transactionContextResolver.use("postgres").run(async () => {
    await transactionContextResolver.afterCommit(() =>
        publishUserCreatedEvent("1"),
    );
});

// Only the sqlite context is in a transaction, so the hook is registered on it
// and runs once that transaction commits
await transactionContextResolver.use("sqlite").run(async () => {
    await transactionContextResolver.afterCommit(() =>
        publishUserCreatedEvent("1"),
    );
});
