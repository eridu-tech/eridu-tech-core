import { RedisCircuitBreakerAdapter } from "eridu-tech/circuit-breaker/redis-circuit-breaker-adapter";
import { database } from "./redis-circuit-breaker-adapter-setup.js";

const redisCircuitBreakerAdapter = new RedisCircuitBreakerAdapter({
    database,
});
