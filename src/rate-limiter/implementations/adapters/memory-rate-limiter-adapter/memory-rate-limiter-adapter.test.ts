import { beforeEach, describe, expect, test } from "vitest";

import { MemoryRateLimiterAdapter } from "@/rate-limiter/implementations/adapters/memory-rate-limiter-adapter/memory-rate-limiter-adapter.js";
import {
    fixedWindowLimiterTestSuite,
    slidingWindowLimiterTestSuite,
} from "@/rate-limiter/implementations/test-utilities/_module-exports.js";

describe(
    "class: MemoryRateLimiterAdapter",
    { tags: ["Memory", "Adapters", "Implementations", "RateLimiter"] },
    () => {
        describe("fixed-window-limiter tests:", () => {
            let adapter: MemoryRateLimiterAdapter;

            beforeEach(() => {
                adapter = new MemoryRateLimiterAdapter({
                    backoffPolicy:
                        fixedWindowLimiterTestSuite.backoffPolicySettings,
                    rateLimiterPolicy:
                        fixedWindowLimiterTestSuite.rateLimiterPolicySettings,
                });
            });

            fixedWindowLimiterTestSuite({
                createAdapter: () => adapter,
                beforeEach,
                describe,
                expect,
                test,
            });
        });
        describe("sliding-window-limiter tests:", () => {
            let adapter: MemoryRateLimiterAdapter;

            beforeEach(() => {
                adapter = new MemoryRateLimiterAdapter({
                    backoffPolicy:
                        slidingWindowLimiterTestSuite.backoffPolicySettings,
                    rateLimiterPolicy:
                        slidingWindowLimiterTestSuite.rateLimiterPolicySettings,
                });
            });

            slidingWindowLimiterTestSuite({
                createAdapter: () => adapter,
                beforeEach,
                describe,
                expect,
                test,
            });
        });
    },
);
