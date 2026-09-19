import { transactionContext } from "./transaction-context-initial-config.js";

// Only one transaction is started: nested runs join the transaction of the outer run
await transactionContext.run(async () => {
    await transactionContext.run(async () => {
        // Same transaction as the outer run
    });
});
