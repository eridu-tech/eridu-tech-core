import { CircuitBreakerFactoryResolver } from "eridu-tech/circuit-breaker";
import { MemoryCircuitBreakerAdapter } from "eridu-tech/circuit-breaker/memory-circuit-breaker-adapter";
import { RedisCircuitBreakerAdapter } from "eridu-tech/circuit-breaker/redis-circuit-breaker-adapter";
import { SuperJsonSerde } from "eridu-tech/serde/super-json-serde";
import { Redis } from "ioredis";

const serde = new SuperJsonSerde();

const database = new Redis("YOUR_REDIS_CONNECTION", {
    lazyConnect: true,
});
await database.connect();

const redisCircuitBreakerAdapter = new RedisCircuitBreakerAdapter({
    database,
});
redisCircuitBreakerAdapter.init();

export const circuitBreakerFactoryResolver = new CircuitBreakerFactoryResolver({
    serde,
    adapters: {
        memory: new MemoryCircuitBreakerAdapter(),
        redis: redisCircuitBreakerAdapter,
    },
    defaultAdapter: "memory",
});

await circuitBreakerFactoryResolver.init();
