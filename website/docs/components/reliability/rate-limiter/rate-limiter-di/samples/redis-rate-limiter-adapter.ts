import { RedisRateLimiterAdapter } from "eridu-tech/rate-limiter/redis-rate-limiter-adapter";
import { Redis } from "ioredis";

export const redisRateLimiterAdapter = new RedisRateLimiterAdapter({
    database: new Redis("YOUR_REDIS_CONNECTION_STRING"),
});
