import { ExecutionContext } from "eridu-tech/execution-context";
import { AlsExecutionContextAdapter } from "eridu-tech/execution-context/als-execution-context-adapter";
import { contextToken } from "eridu-tech/execution-context/contracts";
import {
    MultiTransactionHooks,
    TransactionContext,
} from "eridu-tech/transaction-context";
import { KyselyTransactionAdapter } from "eridu-tech/transaction-context/kysely-transaction-adapter";
import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import { transactionContext as sqliteTransactionContext } from "./transaction-context-initial-config.js";

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

const postgresTransactionContext = new TransactionContext<Kysely<any>>({
    token: contextToken("postgres-transaction"),
    adapter: new KyselyTransactionAdapter({ database: postgresDatabase }),
    executionContext,
});

// Fans out after-commit hooks to every transaction context
export const transactionHooks = new MultiTransactionHooks([
    postgresTransactionContext,
    sqliteTransactionContext,
]);

async function publishUserCreatedEvent(userId: string): Promise<void> {
    // ...
}

// No wrapped context is in a transaction, so the hook runs immediately
await transactionHooks.afterCommit(() => publishUserCreatedEvent("1"));

// Only the postgres context is in a transaction, so the hook is registered on
// it and runs once that transaction commits
await postgresTransactionContext.run(async () => {
    await transactionHooks.afterCommit(() => publishUserCreatedEvent("1"));
});

// Only the sqlite context is in a transaction, so the hook is registered on it
// and runs once that transaction commits
await sqliteTransactionContext.run(async () => {
    await transactionHooks.afterCommit(() => publishUserCreatedEvent("1"));
});
