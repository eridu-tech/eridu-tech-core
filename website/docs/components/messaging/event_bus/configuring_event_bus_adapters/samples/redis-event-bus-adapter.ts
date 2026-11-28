import { RedisEventBusAdapter } from "eridu-tech/event-bus/redis-event-bus-adapter";
import { SuperJsonSerde } from "eridu-tech/serde/super-json-serde";
import { Redis } from "ioredis";

const client = new Redis("YOUR_REDIS_CONNECTION_STRING", {
    lazyConnect: true,
});
await client.connect();
const serde = new SuperJsonSerde();
const eventBusAdapter = new RedisEventBusAdapter({
    client,
    serde,
});
