import { genericToken, LIFETIME } from "eridu-tech/di/contracts";
import { Container } from "eridu-tech/di";
import { ProxyEventBusResolver } from "eridu-tech/event-bus/di";
import { EventBusResolver } from "eridu-tech/event-bus";
import { MemoryEventBusAdapter } from "eridu-tech/event-bus/memory-event-bus-adapter";
import { RedisPubSubEventBusAdapter } from "eridu-tech/event-bus/redis-pub-sub-event-bus-adapter";
import { ExecutionContext } from "eridu-tech/execution-context";
import { AlsExecutionContextAdapter } from "eridu-tech/execution-context/als-execution-context-adapter";
import { SuperJsonSerde } from "eridu-tech/serde/super-json-serde";
import { Redis } from "ioredis";

type Adapters = "memory" | "redis";
type EventMap = {
    userCreated: {
        userId: string;
    };
};

const resolverToken = genericToken<EventBusResolver<Adapters, EventMap>>(
    "eventBusResolver",
);
const executionContext = new ExecutionContext(new AlsExecutionContextAdapter());
const container = new Container({ executionContext });
const serde = new SuperJsonSerde();

container.registerFactory({
    token: resolverToken,
    factory: () =>
        new EventBusResolver<Adapters, EventMap>({
            adapters: {
                memory: new MemoryEventBusAdapter(),
                redis: new RedisPubSubEventBusAdapter({
                    client: new Redis("YOUR_REDIS_CONNECTION_STRING"),
                    serde,
                }),
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
