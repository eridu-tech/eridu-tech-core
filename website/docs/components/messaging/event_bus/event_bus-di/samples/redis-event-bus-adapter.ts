import { RedisPubSubEventBusAdapter } from "eridu-tech/event-bus/redis-pub-sub-event-bus-adapter";
import { SuperJsonSerde } from "eridu-tech/serde/super-json-serde";
import { Redis } from "ioredis";

export const redisEventBusAdapter = new RedisPubSubEventBusAdapter({
    client: new Redis("YOUR_REDIS_CONNECTION_STRING"),
    serde: new SuperJsonSerde(),
});
