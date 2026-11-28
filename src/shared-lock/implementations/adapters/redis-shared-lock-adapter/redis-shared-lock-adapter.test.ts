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
            const redisAdapter = new RedisSharedLockAdapter({
                database: cluster,
            });
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

        describe("setting: useShardingKey", () => {
            test("Should wrap the key in a hash tag by default", async () => {
                const redisAdapter = new RedisSharedLockAdapter({
                    database: cluster,
                });
                redisAdapter.init();

                await redisAdapter.acquireWriter(
                    "plain-writer-lock",
                    randomUUID(),
                    null,
                );
                await redisAdapter.acquireReader({
                    key: "plain-reader-lock",
                    lockId: randomUUID(),
                    limit: 1,
                    ttl: null,
                });

                expect(
                    await cluster.exists("{plain-writer-lock}__writer"),
                ).toBe(1);
                expect(await cluster.exists("plain-writer-lock__writer")).toBe(
                    0,
                );
                expect(
                    await cluster.exists("{plain-reader-lock}__reader"),
                ).toBe(1);
                expect(
                    await cluster.exists("{plain-reader-lock}__reader__limit"),
                ).toBe(1);
            });

            test("Should not wrap a key that already contains a hash tag", async () => {
                const redisAdapter = new RedisSharedLockAdapter({
                    database: cluster,
                });
                redisAdapter.init();

                await redisAdapter.acquireWriter(
                    "prefix{tagged-lock}",
                    randomUUID(),
                    null,
                );

                expect(
                    await cluster.exists("prefix{tagged-lock}__writer"),
                ).toBe(1);
                expect(
                    await cluster.exists("{prefix{tagged-lock}}__writer"),
                ).toBe(0);
            });

            test("Should fail on a cluster when sharding keys are disabled", async () => {
                const redisAdapter = new RedisSharedLockAdapter({
                    database: cluster,
                    useShardingKey: false,
                });
                redisAdapter.init();

                // The writer, reader and reader limit keys hash to different
                // slots, so the cluster rejects the script.
                await expect(
                    redisAdapter.acquireWriter(
                        "plain-writer-lock-2",
                        randomUUID(),
                        null,
                    ),
                ).rejects.toThrow(/CROSSSLOT/);
            });
        });
    },
);
