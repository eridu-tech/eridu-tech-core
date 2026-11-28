import { SemaphoreFactoryResolver } from "eridu-tech/semaphore";
import { MemorySemaphoreAdapter } from "eridu-tech/semaphore/memory-semaphore-adapter";
import { RedisSemaphoreAdapter } from "eridu-tech/semaphore/redis-semaphore-adapter";
import { SuperJsonSerde } from "eridu-tech/serde/super-json-serde";
import { Redis } from "ioredis";

const serde = new SuperJsonSerde();

const database = new Redis("YOUR_REDIS_CONNECTION", {
    lazyConnect: true,
});
await database.connect();

const redisSemaphoreAdapter = new RedisSemaphoreAdapter({ database });
redisSemaphoreAdapter.init();

export const semaphoreFactoryResolver = new SemaphoreFactoryResolver({
    serde,
    adapters: {
        memory: new MemorySemaphoreAdapter(),
        redis: redisSemaphoreAdapter,
    },
    // You can set an optional default adapter
    defaultAdapter: "memory",
});

await semaphoreFactoryResolver.init();
