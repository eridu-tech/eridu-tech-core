import { circuitBreakerFactory } from "./circuit-breaker-initial-config.js";

const circuitBreaker = circuitBreakerFactory.create("resource");

// Will return the key of the circuit-breaker which is "resource"
console.log(circuitBreaker);
