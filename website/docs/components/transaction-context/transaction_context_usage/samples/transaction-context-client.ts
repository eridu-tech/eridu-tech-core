import { transactionContext } from "./transaction-context-initial-config.js";

async function writeAuditLog(message: string): Promise<void> {
    // The base client never joins a transaction
    await transactionContext.client
        .insertInto("audit_logs")
        .values({ message })
        .execute();
}

// No transaction is active, so the base client is the client in use here
console.log(transactionContext.client); // The base client

await writeAuditLog("Started");
