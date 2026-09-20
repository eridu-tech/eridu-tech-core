import { circuitBreakerFactoryResolver } from "./circuit-breaker-factory-resolver-initial-config.js";
import { CIRCUIT_BREAKER_TRIGGER } from "eridu-tech/circuit-breaker/contracts";

await circuitBreakerFactoryResolver
    .setDefaultTrigger(CIRCUIT_BREAKER_TRIGGER.ONLY_ERROR)
    .use("redis")
    .create("a")
    .runOrFail(async () => {
        // ... code to apply circuit-breaker logic
    });
