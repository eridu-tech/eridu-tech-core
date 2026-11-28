import { BREAKER_POLICIES } from "eridu-tech/circuit-breaker/contracts";
import { MemoryCircuitBreakerAdapter } from "eridu-tech/circuit-breaker/memory-circuit-breaker-adapter";

export const circuitBreakerAdapter = new MemoryCircuitBreakerAdapter({
    circuitBreakerPolicy: {
        type: BREAKER_POLICIES.CONSECUTIVE,

        /**
         * Amount of consecutive failures before going from closed -> open.
         * The field is optional.
         */
        failureThreshold: 5,

        /**
         * Amount of consecutive success before going from half-open -> closed.
         * The field is optional.
         */
        successThreshold: 5,
    },
});
