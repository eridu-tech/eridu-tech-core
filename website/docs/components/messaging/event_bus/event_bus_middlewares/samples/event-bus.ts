import { EventBusResolver } from "eridu-tech/event-bus";
import { RedisEventBusAdapter } from "eridu-tech/event-bus/redis-event-bus-adapter";
import { MemoryEventBusAdapter } from "eridu-tech/event-bus/memory-event-bus-adapter";
import { SuperJsonSerde } from "eridu-tech/serde/super-json-serde";
import { Redis } from "ioredis";

const serde = new SuperJsonSerde();

const database = new Redis("YOUR_REDIS_CONNECTION_STRING", {
    lazyConnect: true,
});
await database.connect();

export const eventBusResolver = new EventBusResolver({
    adapters: {
        memory: new MemoryEventBusAdapter(),
        redis: new RedisEventBusAdapter({
            client: database,
            serde,
        }),
    },
    defaultAdapter: "memory",
});

await eventBusResolver.init();
