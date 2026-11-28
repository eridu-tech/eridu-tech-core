import { MongdobRateLimiter } from "eridu-tech/rate-limiter/mongodb-rate-limiter-adapter";
import { transactionContext } from "./mongodb-rate-limiter-adapter-setup.js";

export const mongodbRateLimiterAdapter = new MongdobRateLimiter({
    database: transactionContext,
    collectionName: "rateLimiter",
});

// You need to initialize the adapter once before using it.
// During the initialization the `key` and `expiration` indexes are created.
await mongodbRateLimiterAdapter.init();
