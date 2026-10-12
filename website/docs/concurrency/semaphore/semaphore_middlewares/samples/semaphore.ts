import { SemaphoreFactoryResolver } from "eridu-tech/semaphore";
import { MemorySemaphoreAdapter } from "eridu-tech/semaphore/memory-semaphore-adapter";
import { RedisSemaphoreAdapter } from "eridu-tech/semaphore/redis-semaphore-adapter";
import { Redis } from "ioredis";

export const semaphoreFactoryResolver = new SemaphoreFactoryResolver({
    adapters: {
        memory: new MemorySemaphoreAdapter(),
        redis: new RedisSemaphoreAdapter(
            new Redis("YOUR_REDIS_CONNECTION_STRING"),
        ),
    },
    defaultAdapter: "memory",
});

await semaphoreFactoryResolver.init();
