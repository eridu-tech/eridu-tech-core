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
import { RedisSharedLockAdapter } from "@/shared-lock/implementations/adapters/redis-shared-lock-adapter/_module-exports.js";
import { withSharedLockPrefix } from "@/shared-lock/implementations/plugins/_module-exports.js";
import { sharedLockAdapterTestSuite } from "@/shared-lock/implementations/test-utilities/_module-exports.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";

import type { StartedRedisContainer } from "@testcontainers/redis";

import type { ISharedLockAdapter } from "@/shared-lock/contracts/_module-exports.js";

const timeout = TimeSpan.fromMinutes(2);
describe(
    "class: RedisSharedLockAdapter",
    { tags: ["Redis", "Adapters", "Implementations", "SharedLock"] },
    () => {
        let client: Redis;
        let startedContainer: StartedRedisContainer;
        let adapter: ISharedLockAdapter;
        beforeAll(async () => {
            startedContainer = await new RedisContainer("redis:7.4.2").start();
            client = new Redis(startedContainer.getConnectionUrl(), {
                lazyConnect: true,
            });
            await client.connect();
        }, timeout.toMilliseconds());
        beforeEach(() => {
            const redisAdapter = new RedisSharedLockAdapter(client);
            redisAdapter.init();
            adapter = withPlugin(
                redisAdapter,
                withSharedLockPrefix(randomUUID()),
            );
        });
        afterAll(async () => {
            await client.quit();
            await startedContainer.stop();
        }, timeout.toMilliseconds());
        sharedLockAdapterTestSuite({
            createAdapter: () => adapter,
            test,
            beforeEach,
            expect,
            describe,
        });
    },
);
