import { CircuitBreakerFactoryResolver } from "eridu-tech/circuit-breaker";
import { ProxyCircuitBreakerFactoryResolver } from "eridu-tech/circuit-breaker/di";
import { container } from "./container.js";
import { memoryCircuitBreakerAdapter } from "./memory-circuit-breaker-adapter.js";
import { redisCircuitBreakerAdapter } from "./redis-circuit-breaker-adapter.js";
import { SuperJsonSerde } from "eridu-tech/serde/super-json-serde";

type Adapters = "memory" | "redis";

const serde = new SuperJsonSerde();
const circuitBreakerFactoryResolver =
    new CircuitBreakerFactoryResolver<Adapters>({
        serde,
        adapters: {
            memory: memoryCircuitBreakerAdapter,
            redis: redisCircuitBreakerAdapter,
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
