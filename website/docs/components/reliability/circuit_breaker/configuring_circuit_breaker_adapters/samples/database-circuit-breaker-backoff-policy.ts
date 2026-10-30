import { DatabaseCircuitBreakerAdapter } from "eridu-tech/circuit-breaker/database-circuit-breaker-adapter";
import { constantBackoff } from "eridu-tech/backoff-policies";
import { circuitBreakerStorageAdapter } from "./circuit-breaker-storage-adapter.js";

const circuitBreakerAdapter = new DatabaseCircuitBreakerAdapter({
    adapter: circuitBreakerStorageAdapter,
    backoffPolicy: constantBackoff(),
});
