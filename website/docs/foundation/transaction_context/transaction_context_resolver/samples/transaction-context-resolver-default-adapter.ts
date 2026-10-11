import { transactionContextResolver } from "./transaction-context-resolver-initial-config.js";

await transactionContextResolver.use().run(async () => {
    // Perform work using the default (primary) adapter's transaction.
    await transactionContextResolver.afterCommit(async () => {
        console.log("Transaction committed");
    });
});
