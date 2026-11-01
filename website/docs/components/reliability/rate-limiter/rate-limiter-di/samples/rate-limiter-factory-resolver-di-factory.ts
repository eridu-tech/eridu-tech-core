import { RateLimiterFactoryResolver } from "eridu-tech/rate-limiter";
import { ProxyRateLimiterFactoryResolver } from "eridu-tech/rate-limiter/di";
import { container } from "./container.js";
import { memoryRateLimiterAdapter } from "./memory-rate-limiter-adapter.js";
import { redisRateLimiterAdapter } from "./redis-rate-limiter-adapter.js";
import { SuperJsonSerde } from "eridu-tech/serde/super-json-serde";

type Adapters = "memory" | "redis";

const serde = new SuperJsonSerde();
const rateLimiterFactoryResolver = new RateLimiterFactoryResolver<Adapters>({
    serde,
    adapters: {
        memory: memoryRateLimiterAdapter,
        redis: redisRateLimiterAdapter,
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
