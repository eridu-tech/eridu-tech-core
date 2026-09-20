import { CountBreaker } from "eridu-tech/circuit-breaker/policies";
import { constantBackoff } from "eridu-tech/backoff-policies";
import { circuitBreakerFactoryResolver } from "./database-circuit-breaker-factory-resolver-initial-config.js";

await circuitBreakerFactoryResolver
    .setDefaultBackoffPolicy(constantBackoff())
    .setDefaultCircuitBreakerPolicy(new CountBreaker())
    .use("sqlite")
    .create("a")
    .runOrFail(async () => {
        // ... code to apply circuit-breaker logic
    });
