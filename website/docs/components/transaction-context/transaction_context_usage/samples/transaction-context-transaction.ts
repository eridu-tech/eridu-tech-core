import { transactionContext } from "./transaction-context-initial-config.js";

// The base client is used here, because no transaction is active
console.log(transactionContext.transaction); // null

await transactionContext.run(async () => {
    // The transaction-scoped client
    console.log(transactionContext.transaction);

    // `transaction` is nullable, so check it before using it
    const trx = transactionContext.transaction;
    if (trx !== null) {
        await trx.insertInto("users").values({ id: "1" }).execute();
    }
});
