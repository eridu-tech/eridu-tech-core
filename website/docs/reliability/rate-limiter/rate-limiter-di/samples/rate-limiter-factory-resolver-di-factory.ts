import { Container } from "eridu-tech/di";
import { ExecutionContext } from "eridu-tech/execution-context";
import { AlsExecutionContextAdapter } from "eridu-tech/execution-context/als-execution-context-adapter";
import { RateLimiterFactoryResolver } from "eridu-tech/rate-limiter";
import { DatabaseRateLimiterAdapter } from "eridu-tech/rate-limiter/database-rate-limiter-adapter";
import { ProxyRateLimiterFactoryResolver } from "eridu-tech/rate-limiter/di";
import { MemoryRateLimiterStorageAdapter } from "eridu-tech/rate-limiter/memory-rate-limiter-storage-adapter";
import { RedisRateLimiterAdapter } from "eridu-tech/rate-limiter/redis-rate-limiter-adapter";
import { SuperJsonSerde } from "eridu-tech/serde/super-json-serde";
import { Redis } from "ioredis";

type Adapters = "memory" | "redis";

const executionContext = new ExecutionContext(new AlsExecutionContextAdapter());
const container = new Container({ executionContext });

const serde = new SuperJsonSerde();
const rateLimiterFactoryResolver = new RateLimiterFactoryResolver<Adapters>({
    serde,
    adapters: {
        memory: new DatabaseRateLimiterAdapter({
            adapter: new MemoryRateLimiterStorageAdapter(),
        }),
        redis: new RedisRateLimiterAdapter({
            database: new Redis("YOUR_REDIS_CONNECTION_STRING"),
        }),
    },
    defaultAdapter: "memory",
});

await rateLimiterFactoryResolver.init();

container.registerValue({
    token: RateLimiterFactoryResolver,
    value: rateLimiterFactoryResolver,
});

// Create the proxy before container.init()
export const rateLimiterFactory = new ProxyRateLimiterFactoryResolver<Adapters>(
    {
        container,
        resolverToken: RateLimiterFactoryResolver,
    },
);

await container.init();
