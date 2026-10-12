import { CacheResolver } from "eridu-tech/cache";
import { ProxyCacheResolver } from "eridu-tech/cache/di";
import { MemoryCacheAdapter } from "eridu-tech/cache/memory-cache-adapter";
import { RedisCacheAdapter } from "eridu-tech/cache/redis-cache-adapter";
import { Container } from "eridu-tech/di";
import { ExecutionContext } from "eridu-tech/execution-context";
import { AlsExecutionContextAdapter } from "eridu-tech/execution-context/als-execution-context-adapter";
import { SuperJsonSerde } from "eridu-tech/serde/super-json-serde";
import { Redis } from "ioredis";

type Adapters = "memory" | "redis";

const serde = new SuperJsonSerde();
const executionContext = new ExecutionContext(new AlsExecutionContextAdapter());
const container = new Container({ executionContext });

const cacheResolver = new CacheResolver<Adapters>({
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
