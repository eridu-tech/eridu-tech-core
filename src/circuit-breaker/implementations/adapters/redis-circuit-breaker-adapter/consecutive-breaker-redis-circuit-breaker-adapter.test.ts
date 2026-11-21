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
import { consecutiveBreakerTestSuite } from "@/circuit-breaker/implementations/test-utilities/_module-exports.js";
import { withPlugin } from "@/middleware/implementations/_module-exports.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";

import type { StartedRedisContainer } from "@testcontainers/redis";

import type { ICircuitBreakerAdapter } from "@/circuit-breaker/contracts/_module-exports.js";

const timeout = TimeSpan.fromMinutes(2);
describe(
    "consecutive-breaker class: RedisCircuitBreakerAdapter",
    { tags: ["Redis", "Adapters", "Implementations", "CircuitBreaker"] },
    () => {
        let client: Redis;
        let startedContainer: StartedRedisContainer;
        let adapter: ICircuitBreakerAdapter;
        beforeAll(async () => {
            startedContainer = await new RedisContainer("redis:7.4.2").start();
            client = new Redis(startedContainer.getConnectionUrl());
        }, timeout.toMilliseconds());
        beforeEach(() => {
            adapter = withPlugin(
                new RedisCircuitBreakerAdapter({
                    database: client,
                    backoffPolicy:
                        consecutiveBreakerTestSuite.backoffPolicySettings,
                    circuitBreakerPolicy:
                        consecutiveBreakerTestSuite.circuitBreakerPolicySettings,
                }),
                withCircuitBreakerPrefix(randomUUID()),
            );
        });
        afterAll(async () => {
            await client.quit();
            await startedContainer.stop();
        }, timeout.toMilliseconds());

        consecutiveBreakerTestSuite({
            createAdapter: () => adapter,
            beforeEach,
            describe,
            expect,
            test,
        });
    },
);
