import { CircuitBreakerFactoryResolver } from "eridu-tech/circuit-breaker";
import { DatabaseCircuitBreakerAdapter } from "eridu-tech/circuit-breaker/database-circuit-breaker-adapter";
import { MemoryCircuitBreakerStorageAdapter } from "eridu-tech/circuit-breaker/memory-circuit-breaker-storage-adapter";

export const circuitBreakerFactoryResolver = new CircuitBreakerFactoryResolver({
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
