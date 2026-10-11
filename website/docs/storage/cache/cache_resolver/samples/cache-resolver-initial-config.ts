import { CacheResolver } from "eridu-tech/cache";
import { MemoryCacheAdapter } from "eridu-tech/cache/memory-cache-adapter";
import { RedisCacheAdapter } from "eridu-tech/cache/redis-cache-adapter";
import { SuperJsonSerde } from "eridu-tech/serde/super-json-serde";
import { Redis } from "ioredis";

type User = {
    name: string;
    age: number;
};

const serde = new SuperJsonSerde();
export const cacheResolver = new CacheResolver<"memory" | "redis", User>({
    adapters: {
        memory: new MemoryCacheAdapter(),
        redis: new RedisCacheAdapter({
            database: new Redis("YOUR_REDIS_CONNECTION"),
            serde,
        }),
    },
    // You can set an optional default adapter
    defaultAdapter: "memory",
});

await cacheResolver.init();
