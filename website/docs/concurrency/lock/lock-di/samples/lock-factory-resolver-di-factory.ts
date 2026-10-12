import { LockFactoryResolver } from "eridu-tech/lock";
import { ProxyLockFactoryResolver } from "eridu-tech/lock/di";
import { container } from "./container.js";
import { memoryLockAdapter } from "./memory-lock-adapter.js";
import { redisLockAdapter } from "./redis-lock-adapter.js";

type Adapters = "memory" | "redis";

const lockFactoryResolver = new LockFactoryResolver<Adapters>({
    adapters: {
        memory: memoryLockAdapter,
        redis: redisLockAdapter,
    },
    defaultAdapter: "memory",
});

await lockFactoryResolver.init();

container.registerValue({
    token: LockFactoryResolver,
    value: lockFactoryResolver,
});

// Create the proxy before container.init()
export const lockFactory = new ProxyLockFactoryResolver<Adapters>({
    container,
    resolverToken: LockFactoryResolver,
});

await container.init();
