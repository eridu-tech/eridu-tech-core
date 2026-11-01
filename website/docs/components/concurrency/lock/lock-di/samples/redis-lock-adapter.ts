import { RedisLockAdapter } from "eridu-tech/lock/redis-lock-adapter";
import { Redis } from "ioredis";

export const redisLockAdapter = new RedisLockAdapter(
    new Redis("YOUR_REDIS_CONNECTION_STRING"),
);
