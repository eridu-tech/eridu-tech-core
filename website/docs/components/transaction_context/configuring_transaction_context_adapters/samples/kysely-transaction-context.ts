import { ExecutionContext } from "eridu-tech/execution-context";
import { AlsExecutionContextAdapter } from "eridu-tech/execution-context/als-execution-context-adapter";
import { contextToken } from "eridu-tech/execution-context/contracts";
import { TransactionContext } from "eridu-tech/transaction-context";
import { kyselyTransactionAdapter } from "./kysely-transaction-sqlite.js";
import type { Kysely } from "kysely";

const executionContext = new ExecutionContext(new AlsExecutionContextAdapter());

export const transactionContext = new TransactionContext<Kysely<any>>({
    token: contextToken("kysely-transaction"),
    adapter: kyselyTransactionAdapter,
    executionContext,
});

async function createUser(userId: string): Promise<void> {
    // `current` is the transaction-scoped client when a transaction is active,
    // otherwise the base client
    await transactionContext.current
        .insertInto("users")
        .values({ id: userId })
        .execute();
}

// No transaction is active, so `current` is the base client
await createUser("1");

await transactionContext.run(async () => {
    // A transaction is active, so the same call runs inside it
    await createUser("2");
});
