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
    { tags: ["Redis", "Adapters", "Implementations", "RateLimiter"] },
    () => {
        let client: Redis;
        let startedContainer: StartedRedisContainer;
        let adapter: IRateLimiterAdapter;
        beforeAll(async () => {
            startedContainer = await new RedisContainer("redis:7.4.2").start();
            client = new Redis(startedContainer.getConnectionUrl(), {
                lazyConnect: true,
            });
            await client.connect();
        }, timeout.toMilliseconds());
        beforeEach(() => {
            const redisAdapter = new RedisRateLimiterAdapter({
                database: client,
                backoffPolicy:
                    slidingWindowLimiterTestSuite.backoffPolicySettings,
                rateLimiterPolicy:
                    slidingWindowLimiterTestSuite.rateLimiterPolicySettings,
            });
            redisAdapter.init();
            adapter = withPlugin(
                redisAdapter,
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

        describe("setting: useShardingKey", () => {
            test("Should wrap the key in a hash tag by default", async () => {
                const redisAdapter = new RedisRateLimiterAdapter({
                    database: client,
                    backoffPolicy:
                        slidingWindowLimiterTestSuite.backoffPolicySettings,
                    rateLimiterPolicy:
                        slidingWindowLimiterTestSuite.rateLimiterPolicySettings,
                });
                redisAdapter.init();

                await redisAdapter.updateState("plain-limiter", 1);

                expect(await client.exists("{plain-limiter}")).toBe(1);
                expect(await client.exists("plain-limiter")).toBe(0);
            });

            test("Should not wrap a key that already contains a hash tag", async () => {
                const redisAdapter = new RedisRateLimiterAdapter({
                    database: client,
                    backoffPolicy:
                        slidingWindowLimiterTestSuite.backoffPolicySettings,
                    rateLimiterPolicy:
                        slidingWindowLimiterTestSuite.rateLimiterPolicySettings,
                });
                redisAdapter.init();

                await redisAdapter.updateState("prefix{tagged-limiter}", 1);

                expect(await client.exists("prefix{tagged-limiter}")).toBe(1);
                expect(await client.exists("{prefix{tagged-limiter}}")).toBe(0);
            });

            test("Should not wrap the key when it is disabled", async () => {
                const redisAdapter = new RedisRateLimiterAdapter({
                    database: client,
                    useShardingKey: false,
                    backoffPolicy:
                        slidingWindowLimiterTestSuite.backoffPolicySettings,
                    rateLimiterPolicy:
                        slidingWindowLimiterTestSuite.rateLimiterPolicySettings,
                });
                redisAdapter.init();

                await redisAdapter.updateState("plain-limiter-2", 1);

                expect(await client.exists("plain-limiter-2")).toBe(1);
            });
        });
    },
);
