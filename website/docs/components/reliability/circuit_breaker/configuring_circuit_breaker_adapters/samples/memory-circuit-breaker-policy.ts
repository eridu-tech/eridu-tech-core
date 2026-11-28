import { BACKOFFS } from "eridu-tech/backoff-policies";
import { BREAKER_POLICIES } from "eridu-tech/circuit-breaker/contracts";
import { MemoryCircuitBreakerAdapter } from "eridu-tech/circuit-breaker/memory-circuit-breaker-adapter";
import { TimeSpan } from "eridu-tech/time-span";

export const memoryCircuitBreakerAdapter = new MemoryCircuitBreakerAdapter({
    backoffPolicy: {
        type: BACKOFFS.CONSTANT,
        delay: TimeSpan.fromSeconds(1),
        jitter: 0.5,
    },
    circuitBreakerPolicy: {
        type: BREAKER_POLICIES.CONSECUTIVE,
        failureThreshold: 5,
        successThreshold: 5,
    },
});
