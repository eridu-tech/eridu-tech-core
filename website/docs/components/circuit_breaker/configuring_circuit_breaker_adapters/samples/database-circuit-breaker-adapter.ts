import { DatabaseCircuitBreakerAdapter } from "eridu-tech/circuit-breaker/database-circuit-breaker-adapter";
import { circuitBreakerStorageAdapter } from "./circuit-breaker-storage-adapter.js";

const circuitBreakerAdapter = new DatabaseCircuitBreakerAdapter({
    adapter: circuitBreakerStorageAdapter,
});
