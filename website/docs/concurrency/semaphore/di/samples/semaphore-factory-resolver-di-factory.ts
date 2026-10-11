import { Container } from "eridu-tech/di";
import { ExecutionContext } from "eridu-tech/execution-context";
import { AlsExecutionContextAdapter } from "eridu-tech/execution-context/als-execution-context-adapter";
import { SemaphoreFactoryResolver } from "eridu-tech/semaphore";
import { semaphoreFactoryResolverDiFactory } from "eridu-tech/semaphore/di";
import { MemorySemaphoreAdapter } from "eridu-tech/semaphore/memory-semaphore-adapter";

type Adapters = "storage1" | "storage2";

const executionContext = new ExecutionContext(new AlsExecutionContextAdapter());
const container = new Container({ executionContext });

const semaphoreFactoryResolver = new SemaphoreFactoryResolver<Adapters>({
    adapters: {
        storage1: new MemorySemaphoreAdapter(),
        storage2: new MemorySemaphoreAdapter(),
    },
    defaultAdapter: "storage1",
});

container.registerValue({
    token: SemaphoreFactoryResolver,
    value: semaphoreFactoryResolver,
});

// Create the proxy before container.init()
export const semaphoreFactory = semaphoreFactoryResolverDiFactory<Adapters>(
    container,
    SemaphoreFactoryResolver,
);

await container.init();
