import { LIMITER_POLICIES } from "eridu-tech/rate-limiter/contracts";
import { RedisRateLimiterAdapter } from "eridu-tech/rate-limiter/redis-rate-limiter-adapter";
import { Redis } from "ioredis";

const database = new Redis("YOUR_REDIS_CONNECTION_STRING", {
    lazyConnect: true,
});
await database.connect();

const redisRateLimiterAdapter = new RedisRateLimiterAdapter({
    database,
    rateLimiterPolicy: {
        type: LIMITER_POLICIES.SLIDING_WINDOW,
    },
});
redisRateLimiterAdapter.init();
