import { ExecutionContext } from "eridu-tech/execution-context";
import { AlsExecutionContextAdapter } from "eridu-tech/execution-context/als-execution-context-adapter";
import { contextToken } from "eridu-tech/execution-context/contracts";
import { Serde } from "eridu-tech/serde";
import { SuperJsonSerdeAdapter } from "eridu-tech/serde/super-json-serde-adapter";
import { TransactionContext } from "eridu-tech/transaction-context";
import { MongodbTransactionAdapter } from "eridu-tech/transaction-context/mongodb-transaction-adapter";
import { MongoClient } from "mongodb";
import type { ClientSession, Db } from "mongodb";

export const serde = new Serde(new SuperJsonSerdeAdapter());

const client = await MongoClient.connect("YOUR_MONGODB_CONNECTION_STRING");
const database = client.db("database");

// `MongodbRateLimiterStorageAdapter` is transaction aware: it runs every
// rate-limiter operation through the `current` client of this context.
export const transactionContext = new TransactionContext<Db, ClientSession>({
    token: contextToken("mongodb"),
    adapter: new MongodbTransactionAdapter({
        client,
        database,
    }),
    executionContext: new ExecutionContext(new AlsExecutionContextAdapter()),
});
