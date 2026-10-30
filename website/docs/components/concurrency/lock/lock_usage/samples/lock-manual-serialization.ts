import { Redis } from "ioredis";
import { RedisLockAdapter } from "eridu-tech/lock/redis-lock-adapter";
import { LockFactory } from "eridu-tech/lock";
import { SuperJsonSerde } from "eridu-tech/serde/super-json-serde";

const serde = new SuperJsonSerde();

const redisClient = new Redis("YOUR_REDIS_CONNECTION");

const lockFactory = new LockFactory({
    // You can laso pass in an array of Serde class instances
    serde,
    adapter: new RedisLockAdapter(redisClient),
});

const lock = lockFactory.create("resource");
const serializedLock = await serde.serialize(lock);
const deserializedLock = await serde.deserialize(serializedLock);
