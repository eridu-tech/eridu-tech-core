import { CacheResolver } from "eridu-tech/cache";
import { MemoryCacheAdapter } from "eridu-tech/cache/memory-cache-adapter";

export const cacheResolver = new CacheResolver({
    adapters: {
        storage1: new MemoryCacheAdapter(),
        storage2: new MemoryCacheAdapter(),
    },
    defaultAdapter: "storage1",
});

export const cache = cacheResolver.use();
