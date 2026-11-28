import { MongodbCircuitBreakerAdapter } from "eridu-tech/circuit-breaker/mongodb-circuit-breaker-adapter";
import { transactionContext } from "./mongodb-circuit-breaker-adapter-setup.js";

export const mongodbCircuitBreakerAdapter = new MongodbCircuitBreakerAdapter({
    database: transactionContext,
    collectionName: "circuitBreaker",
});

// You need to initialize the adapter once before using it.
// During the initialization the unique `key` index is created.
await mongodbCircuitBreakerAdapter.init();
