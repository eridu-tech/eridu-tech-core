import { TimeSpan } from "eridu-tech/time-span";
import { MongodbTransactionAdapter } from "eridu-tech/transaction-context/mongodb-transaction-adapter";
import { MongoClient } from "mongodb";

const mongoClient = new MongoClient("mongodb://localhost:27017");

export const mongodbTransactionAdapter = new MongodbTransactionAdapter({
    client: mongoClient,
    database: mongoClient.db("DATABASE_NAME"),

    // Applied when committing a transaction
    commitTimeout: TimeSpan.fromSeconds(10),

    // Applied when aborting a transaction
    abortTimeout: TimeSpan.fromSeconds(10),

    // Passed to `startTransaction` for each new transaction
    startTransactionSettings: {
        readConcern: { level: "snapshot" },
        readPreference: "primary",
        writeConcern: { w: "majority" },
    },

    // Passed to `startSession` when a new session is created
    startSessionSettings: {
        causalConsistency: true,
    },

    // Passed to `endSession` after a transaction is committed or aborted
    endSessionSettings: {},
});
