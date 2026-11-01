import { transactionContext } from "./transaction-context-resolver-di.js";

// Runs inside a transaction using the default (primary) adapter
await transactionContext.run(async () => {
    // Perform transactional work here
    await transactionContext.afterCommit(async () => {
        console.log("Transaction committed");
    });
});
