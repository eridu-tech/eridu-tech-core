import { circuitBreakerFactoryResolver } from "./database-circuit-breaker-factory-resolver-initial-config.js";

// Will apply circuit-breaker logic the default adapter which is MemoryCircuitBreakerStorageAdapter
await circuitBreakerFactoryResolver
    .use()
    .create("a")
    .runOrFail(async () => {
        // ... code to apply circuit-breaker logic
    });
