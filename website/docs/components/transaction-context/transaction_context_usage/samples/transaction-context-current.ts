import { transactionContext } from "./transaction-context-initial-config.js";

async function createUser(userId: string): Promise<void> {
    // Joins the active transaction when there is one, otherwise uses the base client
    await transactionContext.current
        .insertInto("users")
        .values({ id: userId })
        .execute();
}

// No transaction is active, so the base client is used
console.log(transactionContext.current); // The base client

await createUser("1");

await transactionContext.run(async () => {
    // A transaction is active, so the transaction-scoped client is used
    console.log(transactionContext.current); // The transaction-scoped client

    // The very same function now takes part in the transaction
    await createUser("2");
});
