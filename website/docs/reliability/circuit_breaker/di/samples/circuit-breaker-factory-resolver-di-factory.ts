import { CircuitBreakerFactoryResolver } from "eridu-tech/circuit-breaker";
import { DatabaseCircuitBreakerAdapter } from "eridu-tech/circuit-breaker/database-circuit-breaker-adapter";
import { circuitBreakerFactoryResolverDiFactory } from "eridu-tech/circuit-breaker/di";
import { MemoryCircuitBreakerStorageAdapter } from "eridu-tech/circuit-breaker/memory-circuit-breaker-storage-adapter";
import { Container } from "eridu-tech/di";
import { ExecutionContext } from "eridu-tech/execution-context";
import { AlsExecutionContextAdapter } from "eridu-tech/execution-context/als-execution-context-adapter";

type Adapters = "storage1" | "storage2";

const executionContext = new ExecutionContext(new AlsExecutionContextAdapter());
const container = new Container({ executionContext });

const circuitBreakerFactoryResolver =
    new CircuitBreakerFactoryResolver<Adapters>({
        adapters: {
            storage1: new DatabaseCircuitBreakerAdapter({
                adapter: new MemoryCircuitBreakerStorageAdapter(),
            }),
            storage2: new DatabaseCircuitBreakerAdapter({
                adapter: new MemoryCircuitBreakerStorageAdapter(),
            }),
        },
        defaultAdapter: "storage1",
    });

container.registerValue({
    token: CircuitBreakerFactoryResolver,
    value: circuitBreakerFactoryResolver,
});

// Create the proxy before container.init()
export const circuitBreakerFactory =
    circuitBreakerFactoryResolverDiFactory<Adapters>(
        container,
        CircuitBreakerFactoryResolver,
    );

await container.init();
