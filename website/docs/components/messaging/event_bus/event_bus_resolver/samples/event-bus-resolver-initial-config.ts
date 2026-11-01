import { EventBusResolver } from "eridu-tech/event-bus";
import { RedisPubSubEventBusAdapter } from "eridu-tech/event-bus/redis-pub-sub-event-bus-adapter";
import { MemoryEventBusAdapter } from "eridu-tech/event-bus/memory-event-bus-adapter";
import { SuperJsonSerde } from "eridu-tech/serde/super-json-serde";
import { Redis } from "ioredis";
import { z } from "zod";

type EventMap = {
    add: {
        a: 1;
        b: 2;
    };
    sub: {
        c: number;
        d: number;
    };
};

const serde = new SuperJsonSerde();
export const eventBusResolver = new EventBusResolver<
    "memory" | "redis",
    EventMap
>({
    eventMapSchema: {
        add: z.object({
            a: z.literal(1),
            b: z.literal(2),
        }),
        sub: z.object({
            c: z.number(),
            d: z.number(),
        }),
    },
    adapters: {
        memory: new MemoryEventBusAdapter(),
        redis: new RedisPubSubEventBusAdapter({
            client: new Redis("YOUR_REDIS_CONNECTION_STRING"),
            serde,
        }),
    },
    // You can set an optional default adapter
    defaultAdapter: "memory",
});

await eventBusResolver.init();
