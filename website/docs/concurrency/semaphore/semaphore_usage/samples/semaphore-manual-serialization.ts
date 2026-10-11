import { Redis } from "ioredis";
import { RedisSemaphoreAdapter } from "eridu-tech/semaphore/redis-semaphore-adapter";
import { SemaphoreFactory } from "eridu-tech/semaphore";
import { SuperJsonSerde } from "eridu-tech/serde/super-json-serde";

const serde = new SuperJsonSerde();

const redisClient = new Redis("YOUR_REDIS_CONNECTION");

const semaphoreFactory = new SemaphoreFactory({
    // You can laso pass in an array of Serde class instances
    serde,
    adapter: new RedisSemaphoreAdapter(redisClient),
});

const semaphore = semaphoreFactory.create("resource", {
    limit: 2,
});
const serializedSemaphore = await serde.serialize(semaphore);
const deserializedSemaphore = await serde.deserialize(serializedSemaphore);
