import { transactionContext } from "./transaction-context-resolver-di.js";

// Runs inside a transaction using the secondary adapter
await transactionContext.use("secondary").run(async () => {
    // Perform transactional work here
});
