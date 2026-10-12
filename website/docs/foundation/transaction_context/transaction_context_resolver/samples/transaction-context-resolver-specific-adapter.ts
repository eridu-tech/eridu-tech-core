import { transactionContextResolver } from "./transaction-context-resolver-initial-config.js";

await transactionContextResolver.use("sqlite").run(async () => {
    // Perform work using the SQLite adapter's transaction.
});
