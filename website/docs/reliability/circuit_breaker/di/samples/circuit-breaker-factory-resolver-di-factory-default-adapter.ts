import { circuitBreakerFactory } from "./circuit-breaker-factory-resolver-di-factory.js";

// Uses the adapter configured as the default (storage1)
await circuitBreakerFactory.create("shared-resource").runOrFail(async () => {
    // code to run
});
