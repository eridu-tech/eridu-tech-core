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
import { RedisSemaphoreAdapter } from "@/semaphore/implementations/adapters/redis-semaphore-adapter/_module-exports.js";
import { withSemaphorePrefix } from "@/semaphore/implementations/plugins/_module-exports.js";
import { semaphoreAdapterTestSuite } from "@/semaphore/implementations/test-utilities/_module-exports.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";

import type { StartedRedisContainer } from "@testcontainers/redis";

import type { ISemaphoreAdapter } from "@/semaphore/contracts/_module-exports.js";

const timeout = TimeSpan.fromMinutes(2);
describe(
    "class: RedisSemaphoreAdapter",
    { tags: ["Redis", "Adapters", "Implementations", "Semaphore"] },
    () => {
        let client: Redis;
        let startedContainer: StartedRedisContainer;
        let adapter: ISemaphoreAdapter;
        beforeAll(async () => {
            startedContainer = await new RedisContainer("redis:7.4.2").start();
            client = new Redis(startedContainer.getConnectionUrl(), {
                lazyConnect: true,
            });
            await client.connect();
        }, timeout.toMilliseconds());
        beforeEach(() => {
            const redisAdapter = new RedisSemaphoreAdapter(client);
            redisAdapter.init();
            adapter = withPlugin(
                redisAdapter,
                withSemaphorePrefix(randomUUID()),
            );
        });
        afterAll(async () => {
            await client.quit();
            await startedContainer.stop();
        }, timeout.toMilliseconds());
        semaphoreAdapterTestSuite({
            createAdapter: () => adapter,
            test,
            beforeEach,
            expect,
            describe,
        });
    },
);
