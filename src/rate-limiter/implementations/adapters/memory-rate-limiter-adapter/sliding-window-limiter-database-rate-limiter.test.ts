import { beforeEach, describe, expect, test } from "vitest";

import { BACKOFFS } from "@/backoff-policies/implementations/_module-exports.js";
import { LIMITER_POLICIES } from "@/rate-limiter/implementations/adapters/_shared/_module.js";
import { MemoryRateLimiterAdapter } from "@/rate-limiter/implementations/adapters/memory-rate-limiter-adapter/memory-rate-limiter-adapter.js";
import { slidingWindowLimiterTestSuite } from "@/rate-limiter/implementations/test-utilities/_module-exports.js";

describe(
    "sliding-window-limiter class: MemoryRateLimiterAdapter",
    { tags: ["Memory", "Adapters", "Implementations", "RateLimiter"] },
    () => {
        slidingWindowLimiterTestSuite({
            createAdapter: () => {
                const adapter = new MemoryRateLimiterAdapter({
                    backoffPolicy: {
                        type: BACKOFFS.CONSTANT,
                    },
                    rateLimiterPolicy: {
                        type: LIMITER_POLICIES.SLIDING_WINDOW,
                    },
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
