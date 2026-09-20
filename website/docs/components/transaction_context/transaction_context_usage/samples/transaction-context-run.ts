import { transactionContext } from "./transaction-context-initial-config.js";

// Starts a transaction, commits it once the invocable succeeds and returns its result
const user = await transactionContext.run(async () => {
    return transactionContext.current
        .insertInto("users")
        .values({ id: "1", name: "Jose" })
        .returningAll()
        .executeTakeFirst();
});
