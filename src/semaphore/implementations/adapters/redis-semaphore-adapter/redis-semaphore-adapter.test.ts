import { randomUUID } from "node:crypto";

import { Cluster } from "ioredis";
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
import { RedisClusterServer } from "@/test-utilities/servers/redis-cluster-server/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";

import type { ISemaphoreAdapter } from "@/semaphore/contracts/_module-exports.js";

const timeout = TimeSpan.fromMinutes(3);
describe(
    "class: RedisSemaphoreAdapter",
    { tags: ["Redis", "Adapters", "Implementations", "Semaphore"] },
    () => {
        let cluster: Cluster;
        let adapter: ISemaphoreAdapter;
        const clusterServer = new RedisClusterServer();
        beforeAll(async () => {
            await clusterServer.init();
            const { nodes, natMap } = clusterServer.getSettings();
            cluster = new Cluster(nodes, { natMap });
        }, timeout.toMilliseconds());
        beforeEach(() => {
            const redisAdapter = new RedisSemaphoreAdapter(cluster);
            redisAdapter.init();
            adapter = withPlugin(
                redisAdapter,
                withSemaphorePrefix(randomUUID()),
            );
        });
        afterAll(async () => {
            await cluster.quit();
            await clusterServer.deInit();
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
