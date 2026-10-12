import { ExecutionContext } from "eridu-tech/execution-context";
import { AlsExecutionContextAdapter } from "eridu-tech/execution-context/als-execution-context-adapter";
import { TransactionContextResolver } from "eridu-tech/transaction-context";
import { mongodbTransactionAdapter } from "./mongodb-transaction-adapter.js";
import { sqliteTransactionAdapter } from "./sqlite-transaction-adapter.js";

type Adapters = "primary" | "secondary";

const executionContext = new ExecutionContext(new AlsExecutionContextAdapter());

export const transactionContextResolver =
    new TransactionContextResolver<Adapters>({
        adapters: {
            primary: mongodbTransactionAdapter,
            secondary: sqliteTransactionAdapter,
        },
        defaultAdapter: "primary",
        executionContext,
    });

await transactionContextResolver.init();
