import { RedisSemaphoreAdapter } from "eridu-tech/semaphore/redis-semaphore-adapter";
import { Redis } from "ioredis";

export const redisSemaphoreAdapter = new RedisSemaphoreAdapter(
    new Redis("YOUR_REDIS_CONNECTION_STRING"),
);
