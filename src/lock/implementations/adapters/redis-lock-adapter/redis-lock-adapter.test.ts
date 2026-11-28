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
            const redisAdapter = new RedisLockAdapter({ database: client });
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

        describe("setting: useShardingKey", () => {
            test("Should wrap the key in a hash tag by default", async () => {
                const redisAdapter = new RedisLockAdapter({
                    database: client,
                });
                redisAdapter.init();

                await redisAdapter.acquire("plain-lock", randomUUID(), null);

                expect(await client.exists("{plain-lock}")).toBe(1);
            });

            test("Should not wrap a key that already contains a hash tag", async () => {
                const redisAdapter = new RedisLockAdapter({
                    database: client,
                });
                redisAdapter.init();

                await redisAdapter.acquire(
                    "prefix{tagged-lock}",
                    randomUUID(),
                    null,
                );

                expect(await client.exists("prefix{tagged-lock}")).toBe(1);
                expect(await client.exists("{prefix{tagged-lock}}")).toBe(0);
            });

            test("Should not wrap the key when it is disabled", async () => {
                const redisAdapter = new RedisLockAdapter({
                    database: client,
                    useShardingKey: false,
                });
                redisAdapter.init();

                await redisAdapter.acquire("plain-lock-2", randomUUID(), null);

                expect(await client.exists("plain-lock-2")).toBe(1);
            });
        });
    },
);
