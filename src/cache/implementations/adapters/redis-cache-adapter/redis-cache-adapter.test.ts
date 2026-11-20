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

import { RedisCacheAdapter } from "@/cache/implementations/adapters/redis-cache-adapter/_module-exports.js";
import { withCachePrefix } from "@/cache/implementations/plugins/_module-exports.js";
import { cacheAdapterTestSuite } from "@/cache/implementations/test-utilities/_module-exports.js";
import { withPlugin } from "@/middleware/implementations/_module-exports.js";
import { SuperJsonSerde } from "@/serde/implementations/super-json-serde/_module-exports.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";

import type { StartedRedisContainer } from "@testcontainers/redis";

import type { ICacheAdapter } from "@/cache/contracts/_module-exports.js";

const timeout = TimeSpan.fromMinutes(2);
describe("class: RedisCacheAdapter", { tags: ["Redis"] }, () => {
    let client: Redis;
    let startedContainer: StartedRedisContainer;
    let adapter: ICacheAdapter;
    beforeAll(async () => {
        startedContainer = await new RedisContainer("redis:7.4.2").start();
        client = new Redis(startedContainer.getConnectionUrl());
    }, timeout.toMilliseconds());
    beforeEach(() => {
        adapter = withPlugin(
            new RedisCacheAdapter({
                database: client,
                serde: new SuperJsonSerde(),
            }),
            withCachePrefix(randomUUID()),
        );
    });
    afterAll(async () => {
        await client.quit();
        await startedContainer.stop();
    }, timeout.toMilliseconds());
    cacheAdapterTestSuite({
        createAdapter: () => adapter,
        test,
        beforeEach,
        expect,
        describe,
    });
});
