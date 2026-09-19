import { use } from "eridu-tech/middleware";
import { withAfterCommitFactory } from "eridu-tech/transaction-context/middlewares";
import { transactionContext } from "./transaction-context.js";

const withAfterCommit = withAfterCommitFactory(transactionContext);

const sendWelcomeEmail = async (userId: string): Promise<void> => {
    // ...
};

// Registers the wrapped function to run once the active transaction commits
const sendWelcomeEmailAfterCommit = use(sendWelcomeEmail, withAfterCommit());

const sendWelcomeEmailAfterCommitOrSkip = use(
    sendWelcomeEmail,
    // Discards the wrapped function when no transaction is active
    withAfterCommit({ runIfNoTransaction: false }),
);

// Runs once the transaction commits
await transactionContext.run(() => sendWelcomeEmailAfterCommit("1"));

// Does nothing, because no transaction is active
await sendWelcomeEmailAfterCommitOrSkip("2");
