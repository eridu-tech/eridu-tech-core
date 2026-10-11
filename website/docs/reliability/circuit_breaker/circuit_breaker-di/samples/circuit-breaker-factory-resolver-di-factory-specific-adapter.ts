import { circuitBreakerFactory } from "./circuit-breaker-factory-resolver-di-factory.js";

// Uses the storage2 adapter
await circuitBreakerFactory
    .use("storage2")
    .create("shared-resource")
    .runOrFail(async () => {
        // code to run
    });
