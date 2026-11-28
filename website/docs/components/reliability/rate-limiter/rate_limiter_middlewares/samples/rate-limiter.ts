import { RateLimiterFactoryResolver } from "eridu-tech/rate-limiter";
import { MemoryRateLimiterAdapter } from "eridu-tech/rate-limiter/memory-rate-limiter-adapter";
import { RedisRateLimiterAdapter } from "eridu-tech/rate-limiter/redis-rate-limiter-adapter";
import { SuperJsonSerde } from "eridu-tech/serde/super-json-serde";
import { Redis } from "ioredis";

const serde = new SuperJsonSerde();
export const rateLimiterFactoryResolver = new RateLimiterFactoryResolver({
    serde,
    adapters: {
        memory: new MemoryRateLimiterAdapter(),
        redis: new RedisRateLimiterAdapter({
            database: new Redis("YOUR_REDIS_CONNECTION_STRING"),
        }),
    },
    defaultAdapter: "memory",
});

await rateLimiterFactoryResolver.init();
