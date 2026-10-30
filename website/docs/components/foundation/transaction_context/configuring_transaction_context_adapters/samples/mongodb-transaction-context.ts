import { ExecutionContext } from "eridu-tech/execution-context";
import { AlsExecutionContextAdapter } from "eridu-tech/execution-context/als-execution-context-adapter";
import { contextToken } from "eridu-tech/execution-context/contracts";
import { TransactionContext } from "eridu-tech/transaction-context";
import { mongodbTransactionAdapter } from "./mongodb-transaction-adapter-settings.js";
import type { ClientSession, Db } from "mongodb";

const executionContext = new ExecutionContext(new AlsExecutionContextAdapter());

export const transactionContext = new TransactionContext<Db, ClientSession>({
    token: contextToken("mongodb-transaction"),
    adapter: mongodbTransactionAdapter,
    executionContext,
});

// `client` is always the base database, it never becomes transaction-scoped
const users = transactionContext.client.collection("users");

async function createUser(name: string): Promise<void> {
    // Every operation must be given the session to join the active transaction
    await users.insertOne(
        {
            name,
        },
        {
            // The session of the active transaction, or `undefined` outside one
            session: transactionContext.transaction ?? undefined,
        },
    );
}

// No transaction is active, so the insert runs on the base database
await createUser("Jose");

await transactionContext.run(async () => {
    // A transaction is active, so the insert joins it
    await createUser("Jose");
});
