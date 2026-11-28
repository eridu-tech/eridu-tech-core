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

import { RedisLockAdapter } from "@/lock/implementations/adapters/redis-lock-adapter/_module-exports.js";
import { withLockPrefix } from "@/lock/implementations/plugins/_module-exports.js";
import { lockAdapterTestSuite } from "@/lock/implementations/test-utilities/_module-exports.js";
import { withPlugin } from "@/middleware/implementations/_module-exports.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";

import type { StartedRedisContainer } from "@testcontainers/redis";

import type { ILockAdapter } from "@/lock/contracts/_module-exports.js";

const timeout = TimeSpan.fromMinutes(2);
describe(
    "class: RedisLockAdapter",
    { tags: ["Redis", "Adapters", "Implementations", "Lock"] },
    () => {
        let client: Redis;
        let startedContainer: StartedRedisContainer;
        let adapter: ILockAdapter;
        beforeAll(async () => {
            startedContainer = await new RedisContainer("redis:7.4.2").start();
            client = new Redis(startedContainer.getConnectionUrl(), {
                lazyConnect: true,
            });
            await client.connect();
        }, timeout.toMilliseconds());
        beforeEach(() => {
            const redisAdapter = new RedisLockAdapter(client);
            redisAdapter.init();
            adapter = withPlugin(redisAdapter, withLockPrefix(randomUUID()));
        });
        afterAll(async () => {
            await client.quit();
            await startedContainer.stop();
        }, timeout.toMilliseconds());
        lockAdapterTestSuite({
            createAdapter: () => adapter,
            test,
            beforeEach,
            expect,
            describe,
        });
    },
);
