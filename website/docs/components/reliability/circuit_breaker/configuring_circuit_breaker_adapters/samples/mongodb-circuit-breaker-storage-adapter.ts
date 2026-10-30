import { MongodbCircuitBreakerStorageAdapter } from "eridu-tech/circuit-breaker/mongodb-circuit-breaker-storage-adapter";
import {
    serde,
    transactionContext,
} from "./mongodb-circuit-breaker-storage-adapter-setup.js";

const mongodbCircuitBreakerStorageAdapter =
    new MongodbCircuitBreakerStorageAdapter({
        transactionContext,
        serde,
    });

// You need initialize the adapter once before using it.
// During the initialization the indexes will be created
await mongodbCircuitBreakerStorageAdapter.init();
