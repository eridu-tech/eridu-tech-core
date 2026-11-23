import { randomUUID } from "node:crypto";

import { RedisContainer } from "@testcontainers/redis";
import Sqlite from "better-sqlite3";
import { Redis } from "ioredis";
import { Kysely, SqliteDialect } from "kysely";
import {
    describe,
    test,
    beforeEach,
    expect,
    vi,
    beforeAll,
    afterAll,
} from "vitest";

import { RedisPubSubEventBusAdapter } from "@/event-bus/implementations/adapters/redis-pub-sub-event-bus-adapter/redis-pub-sub-event-bus-adapter.js";
import { withEventBusPrefix } from "@/event-bus/implementations/plugins/_module-exports.js";
import { eventBusAdapterTestSuite } from "@/event-bus/implementations/test-utilities/_module-exports.js";
import { contextToken } from "@/execution-context/contracts/_module-exports.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";
import { withPlugin } from "@/middleware/implementations/_module-exports.js";
import { SuperJsonSerde } from "@/serde/implementations/super-json-serde/_module-exports.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";
import { KyselyTransactionAdapter } from "@/transaction-context/implementations/adapters/kysely-transaction-adapter/kysely-transaction-adapter.js";
import { TransactionContext } from "@/transaction-context/implementations/derivables/_module-exports.js";
import { delay } from "@/utilities/_module-exports.js";

import type { StartedRedisContainer } from "@testcontainers/redis";

import type { IEventBusAdapter } from "@/event-bus/contracts/_module-exports.js";
import type { ITransactionData } from "@/transaction-context/implementations/derivables/_module-exports.js";

const timeout = TimeSpan.fromMinutes(2);
describe(
    "class: RedisPubSubEventBusAdapter",
    { tags: ["Redis", "Adapters", "Implementations", "EventBus"] },
    () => {
        let client: Redis;
        let startedContainer: StartedRedisContainer;
        let adapter: IEventBusAdapter;
        const serde = new SuperJsonSerde();
        beforeAll(async () => {
            startedContainer = await new RedisContainer("redis:7.2").start();
            client = new Redis(startedContainer.getConnectionUrl());
        }, timeout.toMilliseconds());
        beforeEach(() => {
            adapter = withPlugin(
                new RedisPubSubEventBusAdapter({
                    client,
                    serde,
                }),
                withEventBusPrefix(randomUUID()),
            );
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
        });

        describe("method: addListener, dispatch", () => {
            const notificationTimeout = TimeSpan.fromMilliseconds(500);

            test("Should dispatch events between separate Redis connections", async () => {
                const prefix = randomUUID();
                const listeningAdapter = withPlugin(
                    new RedisPubSubEventBusAdapter({
                        client,
                        serde,
                    }),
                    withEventBusPrefix(prefix),
                );
                const dispatchingAdapter = withPlugin(
                    new RedisPubSubEventBusAdapter({
                        client,
                        serde,
                    }),
                    withEventBusPrefix(prefix),
                );
                const listenerFn = vi.fn();

                await listeningAdapter.addListener("event", listenerFn);
                await dispatchingAdapter.dispatch("event", { type: "event" });

                await delay(notificationTimeout);
                expect(listenerFn).toHaveBeenCalledTimes(1);
                expect(listenerFn).toHaveBeenCalledWith({ type: "event" });
            });

            test("Should support an empty event name", async () => {
                const emptyNameAdapter = new RedisPubSubEventBusAdapter({
                    client,
                    serde,
                });
                const listenerFn = vi.fn();

                await emptyNameAdapter.addListener("", listenerFn);
                await emptyNameAdapter.dispatch("", { type: "event" });

                await delay(notificationTimeout);
                expect(listenerFn).toHaveBeenCalledTimes(1);
                expect(listenerFn).toHaveBeenCalledWith({ type: "event" });
            });
        });

        test("After commit test:", async () => {
            const database = new Sqlite(":memory:");
            try {
                const transactionContext = new TransactionContext({
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
                const eventBusAdapter = new RedisPubSubEventBusAdapter({
                    client,
                    serde,
                    transactionHooks: transactionContext,
                });

                const listenerFn = vi.fn();
                await eventBusAdapter.addListener("eventA", listenerFn);

                try {
                    await transactionContext.run(async () => {
                        await eventBusAdapter.dispatch("eventA", { data: "A" });
                        throw new Error("Transaction failed");
                    });
                } catch {
                    /* EMPTY */
                }

                expect(listenerFn).not.toHaveBeenCalled();
            } finally {
                database.close();
            }
        });
    },
);
