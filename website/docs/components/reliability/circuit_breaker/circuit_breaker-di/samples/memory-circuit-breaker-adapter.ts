import { DatabaseCircuitBreakerAdapter } from "eridu-tech/circuit-breaker/database-circuit-breaker-adapter";
import { MemoryCircuitBreakerStorageAdapter } from "eridu-tech/circuit-breaker/memory-circuit-breaker-storage-adapter";

export const memoryCircuitBreakerAdapter = new DatabaseCircuitBreakerAdapter({
    adapter: new MemoryCircuitBreakerStorageAdapter(),
});
