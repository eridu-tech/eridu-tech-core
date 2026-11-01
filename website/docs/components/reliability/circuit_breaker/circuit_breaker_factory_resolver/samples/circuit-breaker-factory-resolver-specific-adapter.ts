import { circuitBreakerFactoryResolver } from "./circuit-breaker-factory-resolver-initial-config.js";

// Will apply circuit-breaker logic using the redis adapter
await circuitBreakerFactoryResolver
    .use("redis")
    .create("a")
    .runOrFail(async () => {
        // ... code to apply circuit-breaker logic
    });
