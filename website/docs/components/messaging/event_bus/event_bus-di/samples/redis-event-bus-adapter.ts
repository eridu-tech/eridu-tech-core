import { RedisEventBusAdapter } from "eridu-tech/event-bus/redis-event-bus-adapter";
import { SuperJsonSerde } from "eridu-tech/serde/super-json-serde";
import { Redis } from "ioredis";

export const redisEventBusAdapter = new RedisEventBusAdapter({
    client: new Redis("YOUR_REDIS_CONNECTION_STRING"),
    serde: new SuperJsonSerde(),
});
