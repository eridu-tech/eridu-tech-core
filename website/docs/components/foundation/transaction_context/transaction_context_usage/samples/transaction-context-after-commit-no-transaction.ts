import { transactionContext } from "./transaction-context-initial-config.js";

async function sendWelcomeEmail(userId: string): Promise<void> {
    // ...
}

// No transaction is active, so the hook runs immediately
await transactionContext.afterCommit(() => sendWelcomeEmail("1"));

// No transaction is active, so the hook is discarded
await transactionContext.afterCommit(() => sendWelcomeEmail("2"), {
    runIfNoTransaction: false,
});
