import { MemoryCircuitBreakerAdapter } from "eridu-tech/circuit-breaker/memory-circuit-breaker-adapter";

const adapter = new MemoryCircuitBreakerAdapter();

await adapter.getState("api:users");
// -> looks up circuit "api:users"
