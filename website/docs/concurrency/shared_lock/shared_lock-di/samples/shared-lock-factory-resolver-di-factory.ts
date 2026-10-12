import { SharedLockFactoryResolver } from "eridu-tech/shared-lock";
import { ProxySharedLockFactoryResolver } from "eridu-tech/shared-lock/di";
import { container } from "./container.js";
import { memorySharedLockAdapter } from "./memory-shared-lock-adapter.js";
import { redisSharedLockAdapter } from "./redis-shared-lock-adapter.js";

type Adapters = "memory" | "redis";

const sharedLockFactoryResolver = new SharedLockFactoryResolver<Adapters>({
    adapters: {
        memory: memorySharedLockAdapter,
        redis: redisSharedLockAdapter,
    },
    defaultAdapter: "memory",
});

await sharedLockFactoryResolver.init();

container.registerValue({
    token: SharedLockFactoryResolver,
    value: sharedLockFactoryResolver,
});

// Create the proxy before container.init()
export const sharedLockFactory = new ProxySharedLockFactoryResolver<Adapters>({
    container,
    resolverToken: SharedLockFactoryResolver,
});

await container.init();
