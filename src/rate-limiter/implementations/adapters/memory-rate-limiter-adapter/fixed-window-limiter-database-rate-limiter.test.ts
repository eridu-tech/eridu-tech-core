import { beforeEach, describe, expect, test } from "vitest";

import { MemoryRateLimiterAdapter } from "@/rate-limiter/implementations/adapters/memory-rate-limiter-adapter/memory-rate-limiter-adapter.js";
import { fixedWindowLimiterTestSuite } from "@/rate-limiter/implementations/test-utilities/_module-exports.js";

describe(
    "fixed-window-limiter class: MemoryRateLimiterAdapter",
    { tags: ["Memory", "Adapters", "Implementations", "RateLimiter"] },
    () => {
        fixedWindowLimiterTestSuite({
            createAdapter: () => {
                const adapter = new MemoryRateLimiterAdapter({
                    backoffPolicy:
                        fixedWindowLimiterTestSuite.backoffPolicySettings,
                    rateLimiterPolicy:
                        fixedWindowLimiterTestSuite.rateLimiterPolicySettings,
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
