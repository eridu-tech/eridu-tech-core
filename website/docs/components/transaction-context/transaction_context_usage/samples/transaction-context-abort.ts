import { transactionContext } from "./transaction-context-initial-config.js";

try {
    await transactionContext.run(async () => {
        await transactionContext.current
            .insertInto("users")
            .values({ id: "1", name: "Jose" })
            .execute();

        // Throwing inside the invocable aborts the transaction
        throw new Error("Something went wrong");
    });
} catch (error: unknown) {
    // The original error is re-thrown after the transaction was aborted
    console.error(error);
}
