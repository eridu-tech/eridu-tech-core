import { withPlugin } from "eridu-tech/middleware";
import { MemoryCircuitBreakerAdapter } from "eridu-tech/circuit-breaker/memory-circuit-breaker-adapter";
import { withCircuitBreakerPrefix } from "eridu-tech/circuit-breaker/plugins";

const adapter = new MemoryCircuitBreakerAdapter();

// Apply the prefix plugin to the adapter
const prefixedAdapter = withPlugin(
    adapter,
    withCircuitBreakerPrefix("service-a:"),
);
