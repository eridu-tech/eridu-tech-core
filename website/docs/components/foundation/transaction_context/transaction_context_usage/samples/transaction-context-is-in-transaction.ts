import { transactionContext } from "./transaction-context-initial-config.js";

async function createUser(userId: string): Promise<void> {
    await transactionContext.current
        .insertInto("users")
        .values({ id: userId })
        .execute();
}

async function notify(userId: string): Promise<void> {
    console.log(`Created user ${userId}`);
}

async function createUserAndNotify(userId: string): Promise<void> {
    if (transactionContext.isInTransaction) {
        // Only notify once the active transaction commits
        await transactionContext.afterCommit(() => notify(userId));
    }

    await createUser(userId);

    if (!transactionContext.isInTransaction) {
        // There is no transaction, so notify right away
        await notify(userId);
    }
}

console.log(transactionContext.isInTransaction); // false

await transactionContext.run(() => createUserAndNotify("1"));
