import { circuitBreakerFactory } from "./circuit-breaker-initial-config.js";

export const circuitBreaker = circuitBreakerFactory.create("resource");
