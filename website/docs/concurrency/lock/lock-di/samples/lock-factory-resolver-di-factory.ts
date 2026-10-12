import { Container } from "eridu-tech/di";
import { ExecutionContext } from "eridu-tech/execution-context";
import { AlsExecutionContextAdapter } from "eridu-tech/execution-context/als-execution-context-adapter";
import { LockFactoryResolver } from "eridu-tech/lock";
import { ProxyLockFactoryResolver } from "eridu-tech/lock/di";
import { MemoryLockAdapter } from "eridu-tech/lock/memory-lock-adapter";
import { RedisLockAdapter } from "eridu-tech/lock/redis-lock-adapter";
import { Redis } from "ioredis";

type Adapters = "memory" | "redis";

const executionContext = new ExecutionContext(new AlsExecutionContextAdapter());
const container = new Container({ executionContext });

const lockFactoryResolver = new LockFactoryResolver<Adapters>({
    adapters: {
        memory: new MemoryLockAdapter(),
        redis: new RedisLockAdapter(new Redis("YOUR_REDIS_CONNECTION_STRING")),
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
