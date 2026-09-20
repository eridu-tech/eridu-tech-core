import { RedisRateLimiterAdapter } from "eridu-tech/rate-limiter/redis-rate-limiter-adapter";
import { database } from "./redis-rate-limiter-adapter-setup.js";

const redisRateLimiterAdapter = new RedisRateLimiterAdapter({
    database,
});
