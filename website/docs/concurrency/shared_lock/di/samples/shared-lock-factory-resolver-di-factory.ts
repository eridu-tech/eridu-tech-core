import { Container } from "eridu-tech/di";
import { ExecutionContext } from "eridu-tech/execution-context";
import { AlsExecutionContextAdapter } from "eridu-tech/execution-context/als-execution-context-adapter";
import { SharedLockFactoryResolver } from "eridu-tech/shared-lock";
import { sharedLockFactoryResolverDiFactory } from "eridu-tech/shared-lock/di";
import { MemorySharedLockAdapter } from "eridu-tech/shared-lock/memory-shared-lock-adapter";

type Adapters = "storage1" | "storage2";

const executionContext = new ExecutionContext(new AlsExecutionContextAdapter());
const container = new Container({ executionContext });

const sharedLockFactoryResolver = new SharedLockFactoryResolver<Adapters>({
    adapters: {
        storage1: new MemorySharedLockAdapter(),
        storage2: new MemorySharedLockAdapter(),
    },
    defaultAdapter: "storage1",
});

container.registerValue({
    token: SharedLockFactoryResolver,
    value: sharedLockFactoryResolver,
});

// Create the proxy before container.init()
export const sharedLockFactory = sharedLockFactoryResolverDiFactory<Adapters>(
    container,
    SharedLockFactoryResolver,
);

await container.init();
