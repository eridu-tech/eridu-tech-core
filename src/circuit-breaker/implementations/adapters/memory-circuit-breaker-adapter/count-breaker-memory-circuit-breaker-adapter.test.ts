import { beforeEach, describe, expect, test } from "vitest";

import { MemoryCircuitBreakerAdapter } from "@/circuit-breaker/implementations/adapters/memory-circuit-breaker-adapter/_module-exports.js";
import { countBreakerTestSuite } from "@/circuit-breaker/implementations/test-utilities/_module-exports.js";

describe(
    "count-breaker class: MemoryCircuitBreakerAdapter",
    { tags: ["Memory", "Adapters", "Implementations", "CircuitBreaker"] },
    () => {
        countBreakerTestSuite({
            createAdapter: () =>
                new MemoryCircuitBreakerAdapter({
                    backoffPolicy: countBreakerTestSuite.backoffPolicySettings,
                    circuitBreakerPolicy:
                        countBreakerTestSuite.circuitBreakerPolicySettings,
                }),
            beforeEach,
            describe,
            expect,
            test,
        });
    },
);
