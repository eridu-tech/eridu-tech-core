import { Cluster } from "ioredis";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { RedisClusterServer } from "@/test-utilities/servers/redis-cluster-server/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";

const timeout = TimeSpan.fromMinutes(3);

describe(
    "class: RedisClusterServer",
    { tags: ["Redis", "TestUtilities"] },
    () => {
        const server = new RedisClusterServer();
        let cluster: Cluster;
        beforeAll(async () => {
            await server.init();
            const { nodes, natMap } = server.getSettings();
            cluster = new Cluster(nodes, { natMap });
        }, timeout.toMilliseconds());
        afterAll(async () => {
            await cluster.quit();
            await server.deInit();
        }, timeout.toMilliseconds());

        test("spreads the keys over both shards", async () => {
            expect(server.getSettings().nodes).toHaveLength(2);

            await cluster.set("{a}", "1");
            await cluster.set("{a}__limit", "2");
            await cluster.set("b", "3");
            await cluster.set("c", "4");

            expect(await cluster.mget("{a}", "{a}__limit")).toEqual(["1", "2"]);
            expect(await cluster.get("b")).toBe("3");
            expect(await cluster.get("c")).toBe("4");
        });

        test("runs multi key scripts when the keys share a hash slot", async () => {
            const result = await cluster.eval(
                "return redis.call('GET', KEYS[1]) .. redis.call('GET', KEYS[2])",
                2,
                "{a}",
                "{a}__limit",
            );
            expect(result).toBe("12");
        });

        test("rejects multi key scripts when the keys are in different slots", async () => {
            await expect(
                cluster.eval("return 1", 2, "{a}", "b"),
            ).rejects.toThrow(/CROSSSLOT/);
        });
    },
);
