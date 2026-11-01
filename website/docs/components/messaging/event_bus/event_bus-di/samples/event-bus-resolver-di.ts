import { genericToken, LIFETIME } from "eridu-tech/di/contracts";
import { ProxyEventBusResolver } from "eridu-tech/event-bus/di";
import { EventBusResolver } from "eridu-tech/event-bus";
import { container } from "./container.js";
import { memoryEventBusAdapter } from "./memory-event-bus-adapter.js";
import { redisEventBusAdapter } from "./redis-event-bus-adapter.js";

type Adapters = "memory" | "redis";
type EventMap = {
    userCreated: {
        userId: string;
    };
};

const resolverToken =
    genericToken<EventBusResolver<Adapters, EventMap>>("eventBusResolver");
container.registerFactory({
    token: resolverToken,
    factory: () =>
        new EventBusResolver<Adapters, EventMap>({
            adapters: {
                memory: memoryEventBusAdapter,
                redis: redisEventBusAdapter,
            },
            defaultAdapter: "memory",
        }),
    onInit: async (resolver) => {
        await resolver.init();
    },
    deps: {},
    lifetime: LIFETIME.SINGLETON,
});

// Create the proxy before container.init()
export const eventBus = new ProxyEventBusResolver<Adapters, EventMap>({
    container,
    resolverToken,
});

// Register listeners during application setup, before container.init()
await eventBus.addListener("userCreated", (event) => {
    console.log(event.userId);
});

await container.init();
