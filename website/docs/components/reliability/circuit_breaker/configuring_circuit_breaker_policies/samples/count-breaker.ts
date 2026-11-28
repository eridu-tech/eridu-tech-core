import { BREAKER_POLICIES } from "eridu-tech/circuit-breaker/contracts";
import { MemoryCircuitBreakerAdapter } from "eridu-tech/circuit-breaker/memory-circuit-breaker-adapter";

export const circuitBreakerAdapter = new MemoryCircuitBreakerAdapter({
    circuitBreakerPolicy: {
        type: BREAKER_POLICIES.COUNT,

        /**
         * Percentage (from 0 to 1) failures before going from closed -> open.
         * The field is optional.
         */
        failureThreshold: 0.2,

        /**
         * Percentage (from 0 to 1) successes before going from half-open -> closed.
         * The field is optional.
         */
        successThreshold: 0.8,

        /**
         * Size of the count based sliding window.
         * The field is optional.
         */
        size: 20,

        /**
         * The minimum number of calls to go from closed -> open, half-opened -> closed or half-opened -> open.
         * The field is optional.
         */
        minimumNumberOfCalls: 20,
    },
});
