import { circuitBreakerFactory } from "./circuit-breaker-initial-config.js";

class ErrorA extends Error {}

const circuitBreaker = circuitBreakerFactory.create("resource", {
    errorPolicy: ErrorA,
});
await circuitBreaker.runOrFail(async () => {
    // Call the external service
});
