import { RedisRateLimiterAdapter } from "eridu-tech/rate-limiter/redis-rate-limiter-adapter";
import { Redis } from "ioredis";

const database = new Redis("YOUR_REDIS_CONNECTION_STRING", {
    lazyConnect: true,
});
await database.connect();

export const redisRateLimiterAdapter = new RedisRateLimiterAdapter({
    database,
});
redisRateLimiterAdapter.init();
