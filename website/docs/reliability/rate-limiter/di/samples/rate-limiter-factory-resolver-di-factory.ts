import { Container } from "eridu-tech/di";
import { ExecutionContext } from "eridu-tech/execution-context";
import { AlsExecutionContextAdapter } from "eridu-tech/execution-context/als-execution-context-adapter";
import { RateLimiterFactoryResolver } from "eridu-tech/rate-limiter";
import { DatabaseRateLimiterAdapter } from "eridu-tech/rate-limiter/database-rate-limiter-adapter";
import { rateLimiterFactoryResolverDiFactory } from "eridu-tech/rate-limiter/di";
import { MemoryRateLimiterStorageAdapter } from "eridu-tech/rate-limiter/memory-rate-limiter-storage-adapter";

type Adapters = "storage1" | "storage2";

const executionContext = new ExecutionContext(new AlsExecutionContextAdapter());
const container = new Container({ executionContext });

const rateLimiterFactoryResolver = new RateLimiterFactoryResolver<Adapters>({
    adapters: {
        storage1: new DatabaseRateLimiterAdapter({
            adapter: new MemoryRateLimiterStorageAdapter(),
        }),
        storage2: new DatabaseRateLimiterAdapter({
            adapter: new MemoryRateLimiterStorageAdapter(),
        }),
    },
    defaultAdapter: "storage1",
});

container.registerValue({
    token: RateLimiterFactoryResolver,
    value: rateLimiterFactoryResolver,
});

// Create the proxy before container.init()
export const rateLimiterFactory = rateLimiterFactoryResolverDiFactory<Adapters>(
    container,
    RateLimiterFactoryResolver,
);

await container.init();
