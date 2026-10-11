import { CacheResolver } from "eridu-tech/cache";
import { cacheResolverDiFactory } from "eridu-tech/cache/di";
import { MemoryCacheAdapter } from "eridu-tech/cache/memory-cache-adapter";
import { Container } from "eridu-tech/di";
import { ExecutionContext } from "eridu-tech/execution-context";
import { AlsExecutionContextAdapter } from "eridu-tech/execution-context/als-execution-context-adapter";

type Adapters = "storage1" | "storage2";

const executionContext = new ExecutionContext(new AlsExecutionContextAdapter());
const container = new Container({ executionContext });

const cacheResolver = new CacheResolver<Adapters>({
    adapters: {
        storage1: new MemoryCacheAdapter(),
        storage2: new MemoryCacheAdapter(),
    },
    defaultAdapter: "storage1",
});

container.registerValue({
    token: CacheResolver,
    value: cacheResolver,
});

// Create the proxy before container.init()
export const cache = cacheResolverDiFactory<Adapters>(container, CacheResolver);

await container.init();
