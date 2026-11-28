import { Redis } from "ioredis";
import { RedisCircuitBreakerAdapter } from "eridu-tech/circuit-breaker/redis-circuit-breaker-adapter";
import { CircuitBreakerFactory } from "eridu-tech/circuit-breaker";
import { SuperJsonSerde } from "eridu-tech/serde/super-json-serde";

const serde = new SuperJsonSerde();

const redisClient = new Redis("YOUR_REDIS_CONNECTION", {
    lazyConnect: true,
});
await redisClient.connect();

const redisCircuitBreakerAdapter = new RedisCircuitBreakerAdapter({
    database: redisClient,
});
redisCircuitBreakerAdapter.init();

const circuitBreakerFactory = new CircuitBreakerFactory({
    // You can laso pass in an array of Serde class instances
    serde,
    adapter: redisCircuitBreakerAdapter,
});

const circuitBreaker = circuitBreakerFactory.create("resource");
const serializedCircuitBreaker = serde.serialize(circuitBreaker);
const deserializedCircuitBreaker = serde.deserialize(serializedCircuitBreaker);
