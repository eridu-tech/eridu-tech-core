import { transactionContextResolver } from "./transaction-context-resolver-initial-config.js";

await transactionContextResolver.use("secondary").run(async () => {
    // Perform work using the secondary adapter's transaction.
});
