import { TRANSACTION_PROPAGATION } from "eridu-tech/transaction-context/contracts";
import { transactionContext } from "./transaction-context-initial-config.js";

async function createUser(userId: string): Promise<void> {
    await transactionContext.current
        .insertInto("users")
        .values({ id: userId })
        .execute();
}

// Joins the active transaction, or starts a new one when there is none (default)
await transactionContext.run(TRANSACTION_PROPAGATION.REQUIRED, () =>
    createUser("1"),
);

// Joins the active transaction, or runs without a transaction when there is none
await transactionContext.run(TRANSACTION_PROPAGATION.SUPPORTS, () =>
    createUser("2"),
);

// Requires an active transaction, otherwise a MandatoryPropagationError is thrown
await transactionContext.run(TRANSACTION_PROPAGATION.MANDATORY, () =>
    createUser("3"),
);

// Must run outside of a transaction, otherwise a NeverPropagationError is thrown
await transactionContext.run(TRANSACTION_PROPAGATION.NEVER, () =>
    createUser("4"),
);
