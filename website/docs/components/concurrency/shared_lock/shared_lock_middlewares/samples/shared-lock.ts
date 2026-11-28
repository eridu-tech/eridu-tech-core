import { SharedLockFactoryResolver } from "eridu-tech/shared-lock";
import { MemorySharedLockAdapter } from "eridu-tech/shared-lock/memory-shared-lock-adapter";
import { RedisSharedLockAdapter } from "eridu-tech/shared-lock/redis-shared-lock-adapter";
import { Redis } from "ioredis";

const database = new Redis("YOUR_REDIS_CONNECTION_STRING", {
    lazyConnect: true,
});
await database.connect();

const redisSharedLockAdapter = new RedisSharedLockAdapter({ database });
redisSharedLockAdapter.init();

export const sharedLockFactoryResolver = new SharedLockFactoryResolver({
    adapters: {
        memory: new MemorySharedLockAdapter(),
        redis: redisSharedLockAdapter,
    },
    defaultAdapter: "memory",
});

await sharedLockFactoryResolver.init();
