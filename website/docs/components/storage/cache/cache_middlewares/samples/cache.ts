import { CacheResolver } from "eridu-tech/cache";
import { MemoryCacheAdapter } from "eridu-tech/cache/memory-cache-adapter";
import { RedisCacheAdapter } from "eridu-tech/cache/redis-cache-adapter";
import { SuperJsonSerde } from "eridu-tech/serde/super-json-serde";
import { Redis } from "ioredis";

const serde = new SuperJsonSerde();

export const cacheResolver = new CacheResolver({
    adapters: {
        memory: new MemoryCacheAdapter(),
        redis: new RedisCacheAdapter({
            database: new Redis("YOUR_REDIS_CONNECTION_STRING"),
            serde,
        }),
    },
    defaultAdapter: "memory",
});

await cacheResolver.init();

export const cache = cacheResolver.use();
