import { circuitBreakerFactory } from "./circuit-breaker-initial-config.js";
import { TimeSpan } from "eridu-tech/time-span";

const circuitBreaker = circuitBreakerFactory.create("resource", {
    slowCallTime: TimeSpan.fromSeconds(1),
});
await circuitBreaker.runOrFail(async () => {
    // Call the external service
});
