import { CacheResolver } from "eridu-tech/cache";
import { ProxyCacheResolver } from "eridu-tech/cache/di";
import { container } from "./container.js";
import { memoryCacheAdapter } from "./memory-cache-adapter.js";
import { redisCacheAdapter } from "./redis-cache-adapter.js";

type Adapters = "memory" | "redis";

const cacheResolver = new CacheResolver<Adapters>({
    adapters: {
        memory: memoryCacheAdapter,
        redis: redisCacheAdapter,
    },
    defaultAdapter: "memory",
});

await cacheResolver.init();

container.registerValue({
    token: CacheResolver,
    value: cacheResolver,
});

// Create the proxy before container.init()
export const cache = new ProxyCacheResolver<Adapters>({
    container,
    resolverToken: CacheResolver,
});

await container.init();
