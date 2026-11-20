import { randomUUID } from "node:crypto";

import { RedisContainer } from "@testcontainers/redis";
import { Redis } from "ioredis";
import {
    afterAll,
    beforeAll,
    beforeEach,
    describe,
    expect,
    test,
} from "vitest";

import { withPlugin } from "@/middleware/implementations/_module-exports.js";
import { RedisRateLimiterAdapter } from "@/rate-limiter/implementations/adapters/redis-rate-limiter-adapter/redis-rate-limiter-adapter.js";
import { withRateLimiterPrefix } from "@/rate-limiter/implementations/plugins/_module-exports.js";
import { slidingWindowLimiterTestSuite } from "@/rate-limiter/implementations/test-utilities/_module-exports.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";

import type { StartedRedisContainer } from "@testcontainers/redis";

import type { IRateLimiterAdapter } from "@/rate-limiter/contracts/_module-exports.js";

const timeout = TimeSpan.fromMinutes(2);
describe(
    "sliding-window-limiter class: RedisRateLimiterAdapter",
    { tags: ["Redis"] },
    () => {
        let client: Redis;
        let startedContainer: StartedRedisContainer;
        let adapter: IRateLimiterAdapter;
        beforeAll(async () => {
            startedContainer = await new RedisContainer("redis:7.4.2").start();
            client = new Redis(startedContainer.getConnectionUrl());
        }, timeout.toMilliseconds());
        beforeEach(() => {
            adapter = withPlugin(
                new RedisRateLimiterAdapter({
                    database: client,
                    backoffPolicy:
                        slidingWindowLimiterTestSuite.backoffPolicySettings,
                    rateLimiterPolicy:
                        slidingWindowLimiterTestSuite.rateLimiterPolicySettings,
                }),
                withRateLimiterPrefix(randomUUID()),
            );
        });
        afterAll(async () => {
            await client.quit();
            await startedContainer.stop();
        }, timeout.toMilliseconds());

        slidingWindowLimiterTestSuite({
            createAdapter: () => adapter,
            beforeEach,
            describe,
            expect,
            test,
        });
    },
);
