import { RedisCircuitBreakerAdapter } from "eridu-tech/circuit-breaker/redis-circuit-breaker-adapter";
import { Redis } from "ioredis";

const database = new Redis("YOUR_REDIS_CONNECTION_STRING", {
    lazyConnect: true,
});
await database.connect();

export const redisCircuitBreakerAdapter = new RedisCircuitBreakerAdapter({
    database,
});
redisCircuitBreakerAdapter.init();
