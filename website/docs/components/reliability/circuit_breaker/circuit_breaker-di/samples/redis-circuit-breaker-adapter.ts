import { RedisCircuitBreakerAdapter } from "eridu-tech/circuit-breaker/redis-circuit-breaker-adapter";
import { Redis } from "ioredis";

export const redisCircuitBreakerAdapter = new RedisCircuitBreakerAdapter({
    database: new Redis("YOUR_REDIS_CONNECTION_STRING"),
});
