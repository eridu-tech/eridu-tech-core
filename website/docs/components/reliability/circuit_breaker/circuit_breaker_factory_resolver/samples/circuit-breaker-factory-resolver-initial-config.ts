import { CircuitBreakerFactoryResolver } from "eridu-tech/circuit-breaker";
import { MemoryCircuitBreakerAdapter } from "eridu-tech/circuit-breaker/memory-circuit-breaker-adapter";
import { RedisCircuitBreakerAdapter } from "eridu-tech/circuit-breaker/redis-circuit-breaker-adapter";
import { SuperJsonSerde } from "eridu-tech/serde/super-json-serde";
import { Redis } from "ioredis";

const serde = new SuperJsonSerde();
export const circuitBreakerFactoryResolver = new CircuitBreakerFactoryResolver({
    serde,
    adapters: {
        memory: new MemoryCircuitBreakerAdapter(),
        redis: new RedisCircuitBreakerAdapter({
            database: new Redis("YOUR_REDIS_CONNECTION"),
        }),
    },
    defaultAdapter: "memory",
});

await circuitBreakerFactoryResolver.init();
