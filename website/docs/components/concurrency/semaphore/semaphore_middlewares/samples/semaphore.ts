import { SemaphoreFactoryResolver } from "eridu-tech/semaphore";
import { MemorySemaphoreAdapter } from "eridu-tech/semaphore/memory-semaphore-adapter";
import { RedisSemaphoreAdapter } from "eridu-tech/semaphore/redis-semaphore-adapter";
import { Redis } from "ioredis";

const database = new Redis("YOUR_REDIS_CONNECTION_STRING", {
    lazyConnect: true,
});
await database.connect();

const redisSemaphoreAdapter = new RedisSemaphoreAdapter({ database });
redisSemaphoreAdapter.init();

export const semaphoreFactoryResolver = new SemaphoreFactoryResolver({
    adapters: {
        memory: new MemorySemaphoreAdapter(),
        redis: redisSemaphoreAdapter,
    },
    defaultAdapter: "memory",
});

await semaphoreFactoryResolver.init();
