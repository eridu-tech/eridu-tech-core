import { RedisEventBusAdapter } from "eridu-tech/event-bus/redis-event-bus-adapter";
import { SuperJsonSerde } from "eridu-tech/serde/super-json-serde";
import { Redis } from "ioredis";

const database = new Redis("YOUR_REDIS_CONNECTION_STRING", {
    lazyConnect: true,
});
await database.connect();

export const redisEventBusAdapter = new RedisEventBusAdapter({
    client: database,
    serde: new SuperJsonSerde(),
});
