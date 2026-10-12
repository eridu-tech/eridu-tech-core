import { SemaphoreFactoryResolver } from "eridu-tech/semaphore";
import { ProxySemaphoreFactoryResolver } from "eridu-tech/semaphore/di";
import { container } from "./container.js";
import { memorySemaphoreAdapter } from "./memory-semaphore-adapter.js";
import { redisSemaphoreAdapter } from "./redis-semaphore-adapter.js";

type Adapters = "memory" | "redis";

const semaphoreFactoryResolver = new SemaphoreFactoryResolver<Adapters>({
    adapters: {
        memory: memorySemaphoreAdapter,
        redis: redisSemaphoreAdapter,
    },
    defaultAdapter: "memory",
});

await semaphoreFactoryResolver.init();

container.registerValue({
    token: SemaphoreFactoryResolver,
    value: semaphoreFactoryResolver,
});

// Create the proxy before container.init()
export const semaphoreFactory = new ProxySemaphoreFactoryResolver<Adapters>({
    container,
    resolverToken: SemaphoreFactoryResolver,
});

await container.init();
