import { MongodbRateLimiterStorageAdapter } from "eridu-tech/rate-limiter/mongodb-rate-limiter-storage-adapter";
import {
    serde,
    transactionContext,
} from "./mongodb-rate-limiter-adapter-setup.js";

const mongodbRateLimiterStorageAdapter = new MongodbRateLimiterStorageAdapter({
    transactionContext,
    serde,
});

// You need initialize the adapter once before using it.
// During the initialization the indexes will be created
await mongodbRateLimiterStorageAdapter.init();
