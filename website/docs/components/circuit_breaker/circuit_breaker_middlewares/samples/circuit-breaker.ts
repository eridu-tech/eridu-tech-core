import { CircuitBreakerFactory } from "eridu-tech/circuit-breaker";
import { DatabaseCircuitBreakerAdapter } from "eridu-tech/circuit-breaker/database-circuit-breaker-adapter";
import { MemoryCircuitBreakerStorageAdapter } from "eridu-tech/circuit-breaker/memory-circuit-breaker-storage-adapter";

export const circuitBreakerFactory = new CircuitBreakerFactory({
    adapter: new DatabaseCircuitBreakerAdapter({
        adapter: new MemoryCircuitBreakerStorageAdapter(),
    }),
});
