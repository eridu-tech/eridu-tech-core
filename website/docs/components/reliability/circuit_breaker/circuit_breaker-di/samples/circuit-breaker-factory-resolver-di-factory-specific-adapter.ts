import { circuitBreakerFactory } from "./circuit-breaker-factory-resolver-di-factory.js";

// Uses the Redis adapter
await circuitBreakerFactory
    .use("redis")
    .create("shared-resource")
    .runOrFail(async () => {
        // code to run
    });
