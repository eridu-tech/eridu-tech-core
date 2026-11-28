import { randomUUID } from "node:crypto";

import { RedisContainer } from "@testcontainers/redis";
import Sqlite from "better-sqlite3";
import { Cluster, Redis } from "ioredis";
import { Kysely, SqliteDialect } from "kysely";
import {
    describe,
    test,
    beforeEach,
    afterEach,
    expect,
    vi,
    beforeAll,
    afterAll,
} from "vitest";

import { RedisEventBusAdapter } from "@/event-bus/implementations/adapters/redis-event-bus-adapter/redis-event-bus-adapter.js";
import { withEventBusPrefix } from "@/event-bus/implementations/plugins/_module-exports.js";
import { eventBusAdapterTestSuite } from "@/event-bus/implementations/test-utilities/_module-exports.js";
import { contextToken } from "@/execution-context/contracts/_module-exports.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";
import { withPlugin } from "@/middleware/implementations/_module-exports.js";
import { SuperJsonSerde } from "@/serde/implementations/super-json-serde/_module-exports.js";
import { RedisClusterServer } from "@/test-utilities/servers/redis-cluster-server/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";
import { KyselyTransactionAdapter } from "@/transaction-context/implementations/adapters/kysely-transaction-adapter/kysely-transaction-adapter.js";
import { TransactionContext } from "@/transaction-context/implementations/derivables/_module-exports.js";
import { delay } from "@/utilities/_module-exports.js";

import type { StartedRedisContainer } from "@testcontainers/redis";

import type { ITransactionData } from "@/transaction-context/implementations/derivables/_module-exports.js";

const timeout = TimeSpan.fromMinutes(2);
const dispatchDelay = TimeSpan.fromMilliseconds(500);
describe(
    "class: RedisEventBusAdapter",
    { tags: ["Redis", "Adapters", "Implementations", "EventBus"] },
    () => {
        let client: Redis;
        let startedContainer: StartedRedisContainer;
        let adapter: RedisEventBusAdapter;
        const serde = new SuperJsonSerde();
        beforeAll(async () => {
            startedContainer = await new RedisContainer("redis:7.2").start();
            client = new Redis(startedContainer.getConnectionUrl(), {
                lazyConnect: true,
            });
            await client.connect();
        }, timeout.toMilliseconds());
        beforeEach(() => {
            adapter = withPlugin(
                new RedisEventBusAdapter({
                    client,
                    serde,
                }),
                withEventBusPrefix(randomUUID()),
            );
        });
        afterEach(async () => {
            await adapter.deInit();
        });
        afterAll(async () => {
            await client.quit();
            await startedContainer.stop();
        }, timeout.toMilliseconds());
        eventBusAdapterTestSuite({
            createAdapter: () => adapter,
            test,
            beforeEach,
            expect,
            describe,
            excludePreSubscriptionTests: true,
        });

        describe("method: addListener, dispatch", () => {
            let prefixlessAdapter: RedisEventBusAdapter;
            beforeEach(() => {
                prefixlessAdapter = new RedisEventBusAdapter({
                    client,
                    serde,
                });
            });
            afterEach(async () => {
                await prefixlessAdapter.deInit();
            });

            test("Should support an empty event name", async () => {
                const listenerFn = vi.fn();

                await prefixlessAdapter.addListener("", listenerFn);
                await prefixlessAdapter.dispatch("", { type: "event" });

                await delay(dispatchDelay);
                expect(listenerFn).toHaveBeenCalledTimes(1);
                expect(listenerFn).toHaveBeenCalledWith({ type: "event" });
            });
        });

        describe("method: deInit", () => {
            test("Should not throw when called multiple times", async () => {
                await adapter.deInit();

                await expect(adapter.deInit()).resolves.toBeUndefined();
            });

            test("Should not call listeners when events are dispatched after deInit", async () => {
                const listenerFn = vi.fn();
                await adapter.addListener("event", listenerFn);

                await adapter.deInit();
                await adapter.dispatch("event", { type: "event" });

                await delay(dispatchDelay);
                expect(listenerFn).not.toHaveBeenCalled();
            });
        });

        describe("setting: useShardingKey", () => {
            let shardedAdapter: RedisEventBusAdapter;
            afterEach(async () => {
                await shardedAdapter.deInit();
            });

            test("Should wrap the event name in a hash tag by default", async () => {
                shardedAdapter = new RedisEventBusAdapter({ client, serde });

                await shardedAdapter.addListener("sharded:event", vi.fn());

                expect(await client.pubsub("CHANNELS")).toContain(
                    "{sharded:event}",
                );
            });

            test("Should not wrap an event name that already contains a hash tag", async () => {
                shardedAdapter = new RedisEventBusAdapter({ client, serde });

                await shardedAdapter.addListener(
                    "prefix{tagged:event}",
                    vi.fn(),
                );

                expect(await client.pubsub("CHANNELS")).toContain(
                    "prefix{tagged:event}",
                );
                expect(await client.pubsub("CHANNELS")).not.toContain(
                    "{prefix{tagged:event}}",
                );
            });

            test("Should keep the plain event name when sharding keys are disabled", async () => {
                shardedAdapter = new RedisEventBusAdapter({
                    client,
                    serde,
                    useShardingKey: false,
                });

                await shardedAdapter.addListener("plain:event", vi.fn());

                expect(await client.pubsub("CHANNELS")).toContain(
                    "plain:event",
                );
            });

            test("Should deliver events on the wrapped event name", async () => {
                shardedAdapter = new RedisEventBusAdapter({ client, serde });
                const listenerFn = vi.fn();

                await shardedAdapter.addListener(
                    "sharded:dispatch",
                    listenerFn,
                );
                await shardedAdapter.dispatch("sharded:dispatch", {
                    type: "event",
                });

                await delay(dispatchDelay);
                expect(listenerFn).toHaveBeenCalledTimes(1);
                expect(listenerFn).toHaveBeenCalledWith({ type: "event" });
            });
        });

        describe("Redis cluster:", () => {
            const clusterServer = new RedisClusterServer();
            let cluster: Cluster;
            beforeAll(async () => {
                await clusterServer.init();
                const { nodes, natMap } = clusterServer.getSettings();
                cluster = new Cluster(nodes, { natMap });
            }, timeout.toMilliseconds());
            afterAll(async () => {
                await cluster.quit();
                await clusterServer.deInit();
            }, timeout.toMilliseconds());

            test("Should deliver events through a cluster client", async () => {
                // Sharded pub/sub cannot be tested with the containerized
                // cluster, because the sharded subscriber connects to the node
                // address the cluster announces instead of the mapped one.
                const clusterAdapter = new RedisEventBusAdapter({
                    client: cluster,
                    serde,
                    useShardingKey: false,
                });
                try {
                    const listenerFn = vi.fn();

                    await clusterAdapter.addListener(
                        "cluster:event",
                        listenerFn,
                    );
                    await clusterAdapter.dispatch("cluster:event", {
                        type: "event",
                    });

                    await delay(dispatchDelay);
                    expect(listenerFn).toHaveBeenCalledTimes(1);
                    expect(listenerFn).toHaveBeenCalledWith({ type: "event" });
                } finally {
                    await clusterAdapter.deInit();
                }
            });
        });

        describe("Transaction tests:", () => {
            let database: InstanceType<typeof Sqlite>;
            let transactionContext: TransactionContext<
                Kysely<any>,
                Kysely<any>
            >;
            let trxAwareAdapter: RedisEventBusAdapter;

            beforeEach(() => {
                database = new Sqlite(":memory:");
                transactionContext = new TransactionContext({
                    token: contextToken<ITransactionData<Kysely<any>>>(
                        "kysely",
                    ),
                    adapter: new KyselyTransactionAdapter({
                        database: new Kysely({
                            dialect: new SqliteDialect({
                                database,
                            }),
                        }),
                    }),
                    executionContext: new ExecutionContext(
                        new AlsExecutionContextAdapter(),
                    ),
                });
                trxAwareAdapter = new RedisEventBusAdapter({
                    client,
                    serde,
                    transactionHooks: transactionContext,
                });
            });
            afterEach(async () => {
                database.close();
                await trxAwareAdapter.deInit();
            });

            test("Should not dispatch when the transaction fails", async () => {
                const listenerFn = vi.fn();
                await trxAwareAdapter.addListener("eventA", listenerFn);

                try {
                    await transactionContext.run(async () => {
                        await trxAwareAdapter.dispatch("eventA", {
                            data: "A",
                        });
                        throw new Error("Transaction failed");
                    });
                } catch {
                    /* EMPTY */
                }

                expect(listenerFn).not.toHaveBeenCalled();
            });

            test("Should dispatch only after the transaction commits", async () => {
                const listenerFn = vi.fn();
                await trxAwareAdapter.addListener("eventA", listenerFn);

                await transactionContext.run(async () => {
                    await trxAwareAdapter.dispatch("eventA", { data: "A" });
                    expect(listenerFn).not.toHaveBeenCalled();
                });

                await delay(dispatchDelay);
                expect(listenerFn).toHaveBeenCalledTimes(1);
                expect(listenerFn).toHaveBeenCalledWith({ data: "A" });
            });

            test("Should dispatch immediately when there is no active transaction", async () => {
                const listenerFn = vi.fn();
                await trxAwareAdapter.addListener("eventA", listenerFn);

                await trxAwareAdapter.dispatch("eventA", { data: "A" });

                await delay(dispatchDelay);
                expect(listenerFn).toHaveBeenCalledTimes(1);
                expect(listenerFn).toHaveBeenCalledWith({ data: "A" });
            });
        });
    },
);
