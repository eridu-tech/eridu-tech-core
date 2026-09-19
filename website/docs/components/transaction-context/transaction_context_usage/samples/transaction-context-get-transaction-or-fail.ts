import { transactionContext } from "./transaction-context-initial-config.js";

await transactionContext.run(async () => {
    // Returns the transaction-scoped client, or throws when no transaction is active
    const trx = transactionContext.getTransactionOrFail();

    await trx.insertInto("users").values({ id: "1", name: "Jose" }).execute();
});

// Throws a MandatoryPropagationError, because no transaction is active here
transactionContext.getTransactionOrFail();
