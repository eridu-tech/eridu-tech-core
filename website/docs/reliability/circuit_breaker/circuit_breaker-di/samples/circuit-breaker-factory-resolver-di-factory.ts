import { CircuitBreakerFactoryResolver } from "eridu-tech/circuit-breaker";
import { DatabaseCircuitBreakerAdapter } from "eridu-tech/circuit-breaker/database-circuit-breaker-adapter";
import { ProxyCircuitBreakerFactoryResolver } from "eridu-tech/circuit-breaker/di";
import { MemoryCircuitBreakerStorageAdapter } from "eridu-tech/circuit-breaker/memory-circuit-breaker-storage-adapter";
import { RedisCircuitBreakerAdapter } from "eridu-tech/circuit-breaker/redis-circuit-breaker-adapter";
import { Container } from "eridu-tech/di";
import { ExecutionContext } from "eridu-tech/execution-context";
import { AlsExecutionContextAdapter } from "eridu-tech/execution-context/als-execution-context-adapter";
import { SuperJsonSerde } from "eridu-tech/serde/super-json-serde";
import { Redis } from "ioredis";

type Adapters = "memory" | "redis";

const executionContext = new ExecutionContext(new AlsExecutionContextAdapter());
const container = new Container({ executionContext });

const serde = new SuperJsonSerde();
const circuitBreakerFactoryResolver =
    new CircuitBreakerFactoryResolver<Adapters>({
        serde,
        adapters: {
            memory: new DatabaseCircuitBreakerAdapter({
                adapter: new MemoryCircuitBreakerStorageAdapter(),
            }),
            redis: new RedisCircuitBreakerAdapter({
                database: new Redis("YOUR_REDIS_CONNECTION_STRING"),
            }),
        },
        defaultAdapter: "memory",
    });

await circuitBreakerFactoryResolver.init();

container.registerValue({
    token: CircuitBreakerFactoryResolver,
    value: circuitBreakerFactoryResolver,
});

// Create the proxy before container.init()
export const circuitBreakerFactory =
    new ProxyCircuitBreakerFactoryResolver<Adapters>({
        container,
        resolverToken: CircuitBreakerFactoryResolver,
    });

await container.init();
