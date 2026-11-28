import { MemoryCircuitBreakerAdapter } from "eridu-tech/circuit-breaker/memory-circuit-breaker-adapter";
import { CircuitBreakerFactory } from "eridu-tech/circuit-breaker";

const circuitBreakerFactory = new CircuitBreakerFactory({
    adapter: new MemoryCircuitBreakerAdapter(),
    // Metric tracking will run in the background
    enableAsyncTracking: true,
});
