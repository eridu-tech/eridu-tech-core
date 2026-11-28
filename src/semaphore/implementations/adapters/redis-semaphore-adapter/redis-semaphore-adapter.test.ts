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
            const redisAdapter = new RedisSemaphoreAdapter({
                database: cluster,
            });
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

        describe("setting: useShardingKey", () => {
            test("Should wrap the key in a hash tag by default", async () => {
                const redisAdapter = new RedisSemaphoreAdapter({
                    database: cluster,
                });
                redisAdapter.init();

                await redisAdapter.acquire({
                    key: "plain-semaphore",
                    slotId: randomUUID(),
                    limit: 1,
                    ttl: null,
                });

                expect(await cluster.exists("{plain-semaphore}")).toBe(1);
                expect(await cluster.exists("{plain-semaphore}__limit")).toBe(
                    1,
                );
                expect(await cluster.exists("plain-semaphore")).toBe(0);
            });

            test("Should not wrap a key that already contains a hash tag", async () => {
                const redisAdapter = new RedisSemaphoreAdapter({
                    database: cluster,
                });
                redisAdapter.init();

                await redisAdapter.acquire({
                    key: "prefix{tagged-semaphore}",
                    slotId: randomUUID(),
                    limit: 1,
                    ttl: null,
                });

                expect(await cluster.exists("prefix{tagged-semaphore}")).toBe(
                    1,
                );
                expect(
                    await cluster.exists("prefix{tagged-semaphore}__limit"),
                ).toBe(1);
                expect(await cluster.exists("{prefix{tagged-semaphore}}")).toBe(
                    0,
                );
            });

            test("Should fail on a cluster when sharding keys are disabled", async () => {
                const redisAdapter = new RedisSemaphoreAdapter({
                    database: cluster,
                    useShardingKey: false,
                });
                redisAdapter.init();

                // The plain key and its limit key hash to different slots, so
                // the cluster rejects the script.
                await expect(
                    redisAdapter.acquire({
                        key: "plain-semaphore-2",
                        slotId: randomUUID(),
                        limit: 1,
                        ttl: null,
                    }),
                ).rejects.toThrow(/CROSSSLOT/);
            });
        });
    },
);
