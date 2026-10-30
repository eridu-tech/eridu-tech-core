import { Redis } from "ioredis";
import { RedisCircuitBreakerAdapter } from "eridu-tech/circuit-breaker/redis-circuit-breaker-adapter";
import { CircuitBreakerFactory } from "eridu-tech/circuit-breaker";
import { SuperJsonSerde } from "eridu-tech/serde/super-json-serde";

const serde = new SuperJsonSerde();

const redisClient = new Redis("YOUR_REDIS_CONNECTION");

const circuitBreakerFactory = new CircuitBreakerFactory({
    // You can laso pass in an array of Serde class instances
    serde,
    adapter: new RedisCircuitBreakerAdapter({ database: redisClient }),
});

const circuitBreaker = circuitBreakerFactory.create("resource");
const serializedCircuitBreaker = await serde.serialize(circuitBreaker);
const deserializedCircuitBreaker = await serde.deserialize(
    serializedCircuitBreaker,
);
