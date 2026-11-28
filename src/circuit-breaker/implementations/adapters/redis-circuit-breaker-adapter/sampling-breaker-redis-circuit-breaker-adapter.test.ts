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

import { RedisCircuitBreakerAdapter } from "@/circuit-breaker/implementations/adapters/redis-circuit-breaker-adapter/_module-exports.js";
import { withCircuitBreakerPrefix } from "@/circuit-breaker/implementations/plugins/_module-exports.js";
import { samplingBreakerTestSuite } from "@/circuit-breaker/implementations/test-utilities/_module-exports.js";
import { withPlugin } from "@/middleware/implementations/_module-exports.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";

import type { StartedRedisContainer } from "@testcontainers/redis";

import type { ICircuitBreakerAdapter } from "@/circuit-breaker/contracts/_module-exports.js";

const timeout = TimeSpan.fromMinutes(2);
describe(
    "sampling-breaker class: RedisCircuitBreakerAdapter",
    { tags: ["Redis", "Adapters", "Implementations", "CircuitBreaker"] },
    () => {
        let client: Redis;
        let startedContainer: StartedRedisContainer;
        let adapter: ICircuitBreakerAdapter;
        beforeAll(async () => {
            startedContainer = await new RedisContainer("redis:7.4.2").start();
            client = new Redis(startedContainer.getConnectionUrl(), {
                lazyConnect: true,
            });
            await client.connect();
        }, timeout.toMilliseconds());
        beforeEach(() => {
            const redisAdapter = new RedisCircuitBreakerAdapter({
                database: client,
                backoffPolicy: samplingBreakerTestSuite.backoffPolicySettings,
                circuitBreakerPolicy:
                    samplingBreakerTestSuite.circuitBreakerPolicySettings,
            });
            redisAdapter.init();
            adapter = withPlugin(
                redisAdapter,
                withCircuitBreakerPrefix(randomUUID()),
            );
        });
        afterAll(async () => {
            await client.quit();
            await startedContainer.stop();
        }, timeout.toMilliseconds());

        samplingBreakerTestSuite({
            createAdapter: () => adapter,
            beforeEach,
            describe,
            expect,
            test,
        });

        describe("setting: useShardingKey", () => {
            test("Should wrap the key in a hash tag by default", async () => {
                const redisAdapter = new RedisCircuitBreakerAdapter({
                    database: client,
                    backoffPolicy:
                        samplingBreakerTestSuite.backoffPolicySettings,
                    circuitBreakerPolicy:
                        samplingBreakerTestSuite.circuitBreakerPolicySettings,
                });
                redisAdapter.init();

                await redisAdapter.isolate("plain-breaker");

                expect(await client.exists("{plain-breaker}")).toBe(1);
                expect(await client.exists("plain-breaker")).toBe(0);
            });

            test("Should not wrap a key that already contains a hash tag", async () => {
                const redisAdapter = new RedisCircuitBreakerAdapter({
                    database: client,
                    backoffPolicy:
                        samplingBreakerTestSuite.backoffPolicySettings,
                    circuitBreakerPolicy:
                        samplingBreakerTestSuite.circuitBreakerPolicySettings,
                });
                redisAdapter.init();

                await redisAdapter.isolate("prefix{tagged-breaker}");

                expect(await client.exists("prefix{tagged-breaker}")).toBe(1);
                expect(await client.exists("{prefix{tagged-breaker}}")).toBe(0);
            });

            test("Should not wrap the key when it is disabled", async () => {
                const redisAdapter = new RedisCircuitBreakerAdapter({
                    database: client,
                    useShardingKey: false,
                    backoffPolicy:
                        samplingBreakerTestSuite.backoffPolicySettings,
                    circuitBreakerPolicy:
                        samplingBreakerTestSuite.circuitBreakerPolicySettings,
                });
                redisAdapter.init();

                await redisAdapter.isolate("plain-breaker-2");

                expect(await client.exists("plain-breaker-2")).toBe(1);
            });
        });
    },
);
