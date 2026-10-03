import { Container } from "eridu-tech/di";
import { ExecutionContext } from "eridu-tech/execution-context";
import { AlsExecutionContextAdapter } from "eridu-tech/execution-context/als-execution-context-adapter";
import { LockFactoryResolver } from "eridu-tech/lock";
import { lockFactoryResolverDiFactory } from "eridu-tech/lock/di";
import { MemoryLockAdapter } from "eridu-tech/lock/memory-lock-adapter";

type Adapters = "storage1" | "storage2";

const executionContext = new ExecutionContext(new AlsExecutionContextAdapter());
const container = new Container({ executionContext });

const lockFactoryResolver = new LockFactoryResolver<Adapters>({
    adapters: {
        storage1: new MemoryLockAdapter(),
        storage2: new MemoryLockAdapter(),
    },
    defaultAdapter: "storage1",
});

container.registerValue({
    token: LockFactoryResolver,
    value: lockFactoryResolver,
});

// Create the proxy before container.init()
export const lockFactory = lockFactoryResolverDiFactory<Adapters>(
    container,
    LockFactoryResolver,
);

await container.init();
