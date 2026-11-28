import { Redis } from "ioredis";
import { RedisRateLimiterAdapter } from "eridu-tech/rate-limiter/redis-rate-limiter-adapter";
import { RateLimiterFactory } from "eridu-tech/rate-limiter";
import { SuperJsonSerde } from "eridu-tech/serde/super-json-serde";

const serde = new SuperJsonSerde();

const redisClient = new Redis("YOUR_REDIS_CONNECTION", {
    lazyConnect: true,
});
await redisClient.connect();

const redisRateLimiterAdapter = new RedisRateLimiterAdapter({
    database: redisClient,
});
redisRateLimiterAdapter.init();

const rateLimiterFactory = new RateLimiterFactory({
    // You can laso pass in an array of Serde class instances
    serde,
    adapter: redisRateLimiterAdapter,
});

const rateLimiter = rateLimiterFactory.create("resource", {
    limit: 10,
});
const serializedRateLimiter = serde.serialize(rateLimiter);
const deserializedRateLimiter = serde.deserialize(serializedRateLimiter);
