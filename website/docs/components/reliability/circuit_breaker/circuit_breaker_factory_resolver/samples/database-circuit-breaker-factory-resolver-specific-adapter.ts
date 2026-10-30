import { circuitBreakerFactoryResolver } from "./database-circuit-breaker-factory-resolver-initial-config.js";

// Will apply circuit-breaker logic using the sqlite adapter
await circuitBreakerFactoryResolver
    .use("sqlite")
    .create("a")
    .runOrFail(async () => {
        // ... code to apply circuit-breaker logic
    });
