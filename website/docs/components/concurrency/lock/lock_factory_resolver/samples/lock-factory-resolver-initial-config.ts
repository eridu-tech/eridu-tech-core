import { LockFactoryResolver } from "eridu-tech/lock";
import { MemoryLockAdapter } from "eridu-tech/lock/memory-lock-adapter";
import { RedisLockAdapter } from "eridu-tech/lock/redis-lock-adapter";
import { Redis } from "ioredis";

const database = new Redis("YOUR_REDIS_CONNECTION", {
    lazyConnect: true,
});
await database.connect();

const redisLockAdapter = new RedisLockAdapter({ database });
redisLockAdapter.init();

export const lockFactoryResolver = new LockFactoryResolver({
    adapters: {
        memory: new MemoryLockAdapter(),
        redis: redisLockAdapter,
    },
    // You can set an optional default adapter
    defaultAdapter: "memory",
});

await lockFactoryResolver.init();
