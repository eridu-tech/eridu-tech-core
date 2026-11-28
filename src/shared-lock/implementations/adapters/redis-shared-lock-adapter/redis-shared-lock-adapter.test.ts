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
import { RedisSharedLockAdapter } from "@/shared-lock/implementations/adapters/redis-shared-lock-adapter/_module-exports.js";
import { withSharedLockPrefix } from "@/shared-lock/implementations/plugins/_module-exports.js";
import { sharedLockAdapterTestSuite } from "@/shared-lock/implementations/test-utilities/_module-exports.js";
import { RedisClusterServer } from "@/test-utilities/servers/redis-cluster-server/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";

import type { ISharedLockAdapter } from "@/shared-lock/contracts/_module-exports.js";

const timeout = TimeSpan.fromMinutes(3);
describe(
    "class: RedisSharedLockAdapter",
    { tags: ["Redis", "Adapters", "Implementations", "SharedLock"] },
    () => {
        let cluster: Cluster;
        let adapter: ISharedLockAdapter;
        const clusterServer = new RedisClusterServer();
        beforeAll(async () => {
            await clusterServer.init();
            const { nodes, natMap } = clusterServer.getSettings();
            cluster = new Cluster(nodes, { natMap });
        }, timeout.toMilliseconds());
        beforeEach(() => {
            const redisAdapter = new RedisSharedLockAdapter(cluster);
            redisAdapter.init();
            adapter = withPlugin(
                redisAdapter,
                withSharedLockPrefix(randomUUID()),
            );
        });
        afterAll(async () => {
            await cluster.quit();
            await clusterServer.deInit();
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
