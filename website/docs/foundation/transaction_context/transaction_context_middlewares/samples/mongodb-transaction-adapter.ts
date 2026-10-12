import { MongodbTransactionAdapter } from "eridu-tech/transaction-context/mongodb-transaction-adapter";
import { mongoClient, mongoDatabase } from "./mongodb-database.js";

export const mongodbTransactionAdapter = new MongodbTransactionAdapter({
    client: mongoClient,
    database: mongoDatabase,
});
