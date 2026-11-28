import { BREAKER_POLICIES } from "eridu-tech/circuit-breaker/contracts";
import { RedisCircuitBreakerAdapter } from "eridu-tech/circuit-breaker/redis-circuit-breaker-adapter";
import { Redis } from "ioredis";

const database = new Redis("YOUR_REDIS_CONNECTION_STRING", {
    lazyConnect: true,
});
await database.connect();

const redisCircuitBreakerAdapter = new RedisCircuitBreakerAdapter({
    database,
    circuitBreakerPolicy: {
        type: BREAKER_POLICIES.CONSECUTIVE,
        failureThreshold: 5,
        successThreshold: 5,
    },
});
redisCircuitBreakerAdapter.init();
