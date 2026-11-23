import { beforeEach, describe, expect, test } from "vitest";

import { MemoryCircuitBreakerAdapter } from "@/circuit-breaker/implementations/adapters/memory-circuit-breaker-adapter/_module-exports.js";
import { samplingBreakerTestSuite } from "@/circuit-breaker/implementations/test-utilities/_module-exports.js";

describe(
    "sampling-breaker class: MemoryCircuitBreakerAdapter",
    { tags: ["Memory", "Adapters", "Implementations", "CircuitBreaker"] },
    () => {
        samplingBreakerTestSuite({
            createAdapter: () =>
                new MemoryCircuitBreakerAdapter({
                    backoffPolicy:
                        samplingBreakerTestSuite.backoffPolicySettings,
                    circuitBreakerPolicy:
                        samplingBreakerTestSuite.circuitBreakerPolicySettings,
                }),
            beforeEach,
            describe,
            expect,
            test,
        });
    },
);
