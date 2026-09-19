import { use } from "eridu-tech/middleware";
import { TRANSACTION_PROPAGATION } from "eridu-tech/transaction-context/contracts";
import { withTransactionFactory } from "eridu-tech/transaction-context/middlewares";
import { transactionContext } from "./transaction-context.js";

const withTransaction = withTransactionFactory(transactionContext);

const createUser = async (userId: string, name: string): Promise<string> => {
    await transactionContext.current
        .insertInto("users")
        .values({ id: userId, name })
        .execute();
    return userId;
};

// Runs the wrapped function inside a transaction, using REQUIRED propagation by default
const createUserInTransaction = use(createUser, withTransaction());

// Runs the wrapped function inside the existing transaction
const createUserInExistingTransaction = use(
    createUser,
    withTransaction(TRANSACTION_PROPAGATION.MANDATORY),
);

await createUserInTransaction("1", "Jose");
