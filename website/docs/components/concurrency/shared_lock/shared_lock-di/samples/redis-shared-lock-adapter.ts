import { RedisSharedLockAdapter } from "eridu-tech/shared-lock/redis-shared-lock-adapter";
import { Redis } from "ioredis";

export const redisSharedLockAdapter = new RedisSharedLockAdapter(
    new Redis("YOUR_REDIS_CONNECTION_STRING"),
);
