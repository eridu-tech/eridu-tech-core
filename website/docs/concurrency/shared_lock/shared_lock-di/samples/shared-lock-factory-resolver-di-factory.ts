import { Container } from "eridu-tech/di";
import { ExecutionContext } from "eridu-tech/execution-context";
import { AlsExecutionContextAdapter } from "eridu-tech/execution-context/als-execution-context-adapter";
import { SharedLockFactoryResolver } from "eridu-tech/shared-lock";
import { ProxySharedLockFactoryResolver } from "eridu-tech/shared-lock/di";
import { MemorySharedLockAdapter } from "eridu-tech/shared-lock/memory-shared-lock-adapter";
import { RedisSharedLockAdapter } from "eridu-tech/shared-lock/redis-shared-lock-adapter";
import { Redis } from "ioredis";

type Adapters = "memory" | "redis";

const executionContext = new ExecutionContext(new AlsExecutionContextAdapter());
const container = new Container({ executionContext });

const sharedLockFactoryResolver = new SharedLockFactoryResolver<Adapters>({
    adapters: {
        memory: new MemorySharedLockAdapter(),
        redis: new RedisSharedLockAdapter(
            new Redis("YOUR_REDIS_CONNECTION_STRING"),
        ),
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
