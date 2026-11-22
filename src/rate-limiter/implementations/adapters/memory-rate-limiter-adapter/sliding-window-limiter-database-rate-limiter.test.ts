import { beforeEach, describe, expect, test } from "vitest";

import { MemoryRateLimiterAdapter } from "@/rate-limiter/implementations/adapters/memory-rate-limiter-adapter/memory-rate-limiter-adapter.js";
import { slidingWindowLimiterTestSuite } from "@/rate-limiter/implementations/test-utilities/_module-exports.js";

describe(
    "sliding-window-limiter class: MemoryRateLimiterAdapter",
    { tags: ["Memory", "Adapters", "Implementations", "RateLimiter"] },
    () => {
        slidingWindowLimiterTestSuite({
            createAdapter: () => {
                const adapter = new MemoryRateLimiterAdapter({
                    backoffPolicy:
                        slidingWindowLimiterTestSuite.backoffPolicySettings,
                    rateLimiterPolicy:
                        slidingWindowLimiterTestSuite.rateLimiterPolicySettings,
                });
                return adapter;
            },
            beforeEach,
            describe,
            expect,
            test,
        });
    },
);
