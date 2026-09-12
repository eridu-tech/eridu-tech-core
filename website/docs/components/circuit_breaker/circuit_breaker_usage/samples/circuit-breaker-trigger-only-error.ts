import { circuitBreakerFactory } from "./circuit-breaker-initial-config.js";
import { CIRCUIT_BREAKER_TRIGGER } from "eridu-tech/circuit-breaker/contracts";

const circuitBreaker = circuitBreakerFactory.create("resource", {
    trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_ERROR,
});
await circuitBreaker.runOrFail(async () => {
    // Call the external service
});
