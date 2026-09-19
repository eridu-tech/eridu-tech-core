import { MongodbTransactionAdapter } from "eridu-tech/transaction-context/mongodb-transaction-adapter";
import { MongoClient } from "mongodb";

// The client used to start sessions and transactions
const mongoClient = new MongoClient("mongodb://localhost:27017");

// The database exposed as the base (non-transactional) client
const database = mongoClient.db("DATABASE_NAME");

export const mongodbTransactionAdapter = new MongodbTransactionAdapter({
    client: mongoClient,
    database,
});
