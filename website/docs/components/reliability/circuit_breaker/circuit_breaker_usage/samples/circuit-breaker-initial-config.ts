import { MemoryCircuitBreakerAdapter } from "eridu-tech/circuit-breaker/memory-circuit-breaker-adapter";
import { CircuitBreakerFactory } from "eridu-tech/circuit-breaker";

export const circuitBreakerFactory = new CircuitBreakerFactory({
    // You can provide default settings
    // You can choose the adapter to use
    adapter: new MemoryCircuitBreakerAdapter(),
});

await circuitBreakerFactory.init();
