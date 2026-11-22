import { beforeEach, describe, expect, test } from "vitest";

import { BACKOFFS } from "@/backoff-policies/implementations/_module-exports.js";
import { LIMITER_POLICIES } from "@/rate-limiter/contracts/_module-exports.js";
import { MemoryRateLimiterAdapter } from "@/rate-limiter/implementations/adapters/memory-rate-limiter-adapter/memory-rate-limiter-adapter.js";
import { fixedWindowLimiterTestSuite } from "@/rate-limiter/implementations/test-utilities/_module-exports.js";

describe(
    "fixed-window-limiter class: MemoryRateLimiterAdapter",
    { tags: ["Memory", "Adapters", "Implementations", "RateLimiter"] },
    () => {
        fixedWindowLimiterTestSuite({
            createAdapter: () => {
                const adapter = new MemoryRateLimiterAdapter({
                    backoffPolicy: {
                        type: BACKOFFS.CONSTANT,
                    },
                    rateLimiterPolicy: {
                        type: LIMITER_POLICIES.FIXED_WINDOW,
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
