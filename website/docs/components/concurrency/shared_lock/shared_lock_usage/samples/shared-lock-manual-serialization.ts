import { Redis } from "ioredis";
import { RedisSharedLockAdapter } from "eridu-tech/shared-lock/redis-shared-lock-adapter";
import { SharedLockFactory } from "eridu-tech/shared-lock";
import { SuperJsonSerde } from "eridu-tech/serde/super-json-serde";

const serde = new SuperJsonSerde();

const redisClient = new Redis("YOUR_REDIS_CONNECTION", {
    lazyConnect: true,
});
await redisClient.connect();

const redisSharedLockAdapter = new RedisSharedLockAdapter(redisClient);
redisSharedLockAdapter.init();

const sharedLockFactory = new SharedLockFactory({
    // You can laso pass in an array of Serde class instances
    serde,
    adapter: redisSharedLockAdapter,
});

const sharedLock = sharedLockFactory.create("resource", {
    limit: 2,
});
const serializedSharedLock = serde.serialize(sharedLock);
const deserializedSharedLock = serde.deserialize(serializedSharedLock);
