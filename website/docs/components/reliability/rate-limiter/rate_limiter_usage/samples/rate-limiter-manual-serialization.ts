import { Redis } from "ioredis";
import { RedisRateLimiterAdapter } from "eridu-tech/rate-limiter/redis-rate-limiter-adapter";
import { RateLimiterFactory } from "eridu-tech/rate-limiter";
import { SuperJsonSerde } from "eridu-tech/serde/super-json-serde";

const serde = new SuperJsonSerde();

const redisClient = new Redis("YOUR_REDIS_CONNECTION");

const rateLimiterFactory = new RateLimiterFactory({
    // You can laso pass in an array of Serde class instances
    serde,
    adapter: new RedisRateLimiterAdapter({ database: redisClient }),
});

const rateLimiter = rateLimiterFactory.create("resource", {
    limit: 10,
});
const serializedRateLimiter = await serde.serialize(rateLimiter);
const deserializedRateLimiter = await serde.deserialize(serializedRateLimiter);
