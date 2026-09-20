import { transactionContext } from "./transaction-context-initial-config.js";

async function sendWelcomeEmail(userId: string): Promise<void> {
    // ...
}

await transactionContext.run(async () => {
    await transactionContext.current
        .insertInto("users")
        .values({ id: "1", name: "Jose" })
        .execute();

    // Registered as an after-commit hook, so it only runs once the transaction commits
    await transactionContext.afterCommit(() => sendWelcomeEmail("1"));
});
