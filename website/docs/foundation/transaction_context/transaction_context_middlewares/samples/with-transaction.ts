import { use } from "eridu-tech/middleware";
import { withTransactionFactory } from "eridu-tech/transaction-context/middlewares";
import { transactionContextResolver } from "./transaction-context.js";

const withTransaction = withTransactionFactory(transactionContextResolver);

const createUser = async (userId: string, name: string): Promise<string> => {
    // ...
    return "user-id";
};

// Uses the default adapter (`primary`) and REQUIRED propagation
const createUserInTransaction = use(createUser, withTransaction());

// Uses the `secondary` adapter
const createUserOnSecondary = use(
    createUser,
    withTransaction.use("secondary")(),
);

await createUserInTransaction("1", "Jose");
await createUserOnSecondary("2", "Mina");
