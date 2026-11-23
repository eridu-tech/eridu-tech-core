import { beforeEach, describe, expect, test } from "vitest";

import { MemoryCircuitBreakerAdapter } from "@/circuit-breaker/implementations/adapters/memory-circuit-breaker-adapter/_module-exports.js";
import { consecutiveBreakerTestSuite } from "@/circuit-breaker/implementations/test-utilities/_module-exports.js";

describe(
    "consecutive-breaker class: MemoryCircuitBreakerAdapter",
    { tags: ["Memory", "Adapters", "Implementations", "CircuitBreaker"] },
    () => {
        consecutiveBreakerTestSuite({
            createAdapter: () =>
                new MemoryCircuitBreakerAdapter({
                    backoffPolicy:
                        consecutiveBreakerTestSuite.backoffPolicySettings,
                    circuitBreakerPolicy:
                        consecutiveBreakerTestSuite.circuitBreakerPolicySettings,
                }),
            beforeEach,
            describe,
            expect,
            test,
        });
    },
);
