import { ExecutionContext } from "eridu-tech/execution-context";
import { AlsExecutionContextAdapter } from "eridu-tech/execution-context/als-execution-context-adapter";
import { TransactionContextResolver } from "eridu-tech/transaction-context";
import { mongodbTransactionAdapter } from "./mongodb-transaction-adapter.js";
import { sqliteTransactionAdapter } from "./sqlite-transaction-adapter.js";

type Adapters = "mongodb" | "sqlite";

const executionContext = new ExecutionContext(new AlsExecutionContextAdapter());

export const transactionContextResolver =
    new TransactionContextResolver<Adapters>({
        adapters: {
            mongodb: mongodbTransactionAdapter,
            sqlite: sqliteTransactionAdapter,
        },
        defaultAdapter: "mongodb",
        executionContext,
    });

await transactionContextResolver.init();
