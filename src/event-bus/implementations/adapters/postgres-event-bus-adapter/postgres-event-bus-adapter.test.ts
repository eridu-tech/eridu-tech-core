import { randomUUID } from "node:crypto";

import { PostgreSqlContainer } from "@testcontainers/postgresql";
import Sqlite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import { Client } from "pg";
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

import { PostgresEventBusAdapter } from "@/event-bus/implementations/adapters/postgres-event-bus-adapter/postgres-event-bus-adapter.js";
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

import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";

import type { ITransactionData } from "@/transaction-context/implementations/derivables/_module-exports.js";

const timeout = TimeSpan.fromMinutes(2);
const dispatchDelay = TimeSpan.fromMilliseconds(500);
describe(
    "class: PostgresEventBusAdapter",
    { tags: ["Postgres", "Adapters", "Implementations", "EventBus"] },
    () => {
        let startedContainer: StartedPostgreSqlContainer;
        let client: Client;
        let extraClient: Client;
        let adapter: PostgresEventBusAdapter;
        const serde = new SuperJsonSerde();

        beforeAll(async () => {
            startedContainer = await new PostgreSqlContainer(
                "postgres:17.5",
            ).start();
            client = new Client({
                host: startedContainer.getHost(),
                port: startedContainer.getPort(),
                database: startedContainer.getDatabase(),
                user: startedContainer.getUsername(),
                password: startedContainer.getPassword(),
            });
            await client.connect();
        }, timeout.toMilliseconds());
        beforeEach(async () => {
            extraClient = new Client({
                host: startedContainer.getHost(),
                port: startedContainer.getPort(),
                database: startedContainer.getDatabase(),
                user: startedContainer.getUsername(),
                password: startedContainer.getPassword(),
            });
            await extraClient.connect();
            adapter = withPlugin(
                new PostgresEventBusAdapter({
                    client,
                    serde,
                }),
                withEventBusPrefix(randomUUID()),
            );
        });
        afterEach(async () => {
            await adapter.deInit();
            await extraClient.end();
        });
        afterAll(async () => {
            await client.end();
            await startedContainer.stop();
        }, timeout.toMilliseconds());
        eventBusAdapterTestSuite({
            createAdapter: () => adapter,
            test,
            beforeEach,
            expect,
            describe,
        });

        describe("constructor:", () => {
            let channelAdapter: PostgresEventBusAdapter;
            let channelName: string;

            beforeEach(() => {
                channelName = `eridu_test_${randomUUID().replace(/-/g, "")}`;
            });
            afterEach(async () => {
                await channelAdapter.deInit();
            });

            async function getListeningChannels(): Promise<
                ReadonlyArray<string>
            > {
                const result = await client.query<{ channel: string }>(
                    "SELECT pg_listening_channels() AS channel",
                );
                return result.rows.map((row) => row.channel);
            }

            test("Should listen on a default channel when channelName is not provided", async () => {
                channelAdapter = new PostgresEventBusAdapter({ client, serde });
                const listenerFn = vi.fn();
                await channelAdapter.addListener("event", listenerFn);

                const listeningChannels = await getListeningChannels();
                expect(listeningChannels).toHaveLength(1);
                const [defaultChannelName] = listeningChannels;

                await extraClient.query("SELECT pg_notify($1, $2)", [
                    defaultChannelName,
                    serde.serialize({
                        eventName: "event",
                        eventData: { type: "event" },
                    }),
                ]);

                await delay(dispatchDelay);
                expect(listenerFn).toHaveBeenCalledTimes(1);
                expect(listenerFn).toHaveBeenCalledWith({ type: "event" });
            });

            test("Should listen on the provided channel name", async () => {
                channelAdapter = new PostgresEventBusAdapter({
                    client,
                    serde,
                    channelName,
                });
                const listenerFn = vi.fn();
                await channelAdapter.addListener("event", listenerFn);

                const listeningChannels = await getListeningChannels();
                expect(listeningChannels).toEqual([channelName]);

                await extraClient.query("SELECT pg_notify($1, $2)", [
                    channelName,
                    serde.serialize({
                        eventName: "event",
                        eventData: { type: "event" },
                    }),
                ]);

                await delay(dispatchDelay);
                expect(listenerFn).toHaveBeenCalledTimes(1);
                expect(listenerFn).toHaveBeenCalledWith({ type: "event" });
            });

            test("Should ignore notifications sent on another channel", async () => {
                const otherChannelName = `${channelName}_other`;
                channelAdapter = new PostgresEventBusAdapter({
                    client,
                    serde,
                    channelName,
                });
                const listenerFn = vi.fn();
                await channelAdapter.addListener("event", listenerFn);

                await extraClient.query("SELECT pg_notify($1, $2)", [
                    otherChannelName,
                    serde.serialize({
                        eventName: "event",
                        eventData: { type: "event" },
                    }),
                ]);

                await delay(dispatchDelay);
                expect(listenerFn).not.toHaveBeenCalled();
            });

            test("Should dispatch on the provided channel name", async () => {
                channelAdapter = new PostgresEventBusAdapter({
                    client,
                    serde,
                    channelName,
                });
                const notifications: Array<{
                    channel: string;
                    payload?: string;
                }> = [];
                extraClient.on("notification", (notification) => {
                    notifications.push({
                        channel: notification.channel,
                        payload: notification.payload,
                    });
                });
                await extraClient.query(
                    `LISTEN ${extraClient.escapeIdentifier(channelName)}`,
                );

                await channelAdapter.dispatch("event", { type: "event" });

                await delay(dispatchDelay);
                expect(notifications).toHaveLength(1);
                expect(notifications[0]?.channel).toBe(channelName);
                expect(
                    serde.deserialize(notifications[0]?.payload ?? ""),
                ).toEqual({
                    eventName: "event",
                    eventData: { type: "event" },
                });
            });

            test("Should use the hashed channel name", async () => {
                const hashedChannelName = `hashed_${channelName}`;
                const hash = vi.fn(() => Promise.resolve(hashedChannelName));
                channelAdapter = new PostgresEventBusAdapter({
                    client,
                    serde,
                    channelName,
                    hash,
                });

                const notifications: Array<string> = [];
                extraClient.on("notification", (notification) => {
                    notifications.push(notification.channel);
                });
                await extraClient.query(
                    `LISTEN ${extraClient.escapeIdentifier(hashedChannelName)}`,
                );

                const listenerFn = vi.fn();
                await channelAdapter.addListener("event", listenerFn);
                await channelAdapter.dispatch("event", { type: "event" });

                await delay(dispatchDelay);
                expect(hash).toHaveBeenCalledTimes(1);
                expect(hash).toHaveBeenCalledWith(channelName);
                expect(await getListeningChannels()).toEqual([
                    hashedChannelName,
                ]);
                expect(notifications).toEqual([hashedChannelName]);
                expect(listenerFn).toHaveBeenCalledTimes(1);
                expect(listenerFn).toHaveBeenCalledWith({ type: "event" });
            });
        });

        describe("method: addListener, dispatch", () => {
            let prefixlessAdapter: PostgresEventBusAdapter;
            beforeEach(() => {
                prefixlessAdapter = new PostgresEventBusAdapter({
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

            test("Should dispatch to listeners on a different client", async () => {
                const publishingAdapter = new PostgresEventBusAdapter({
                    client: extraClient,
                    serde,
                });
                try {
                    const listeningClientListenerFn = vi.fn();
                    const publishingClientListenerFn = vi.fn();
                    await prefixlessAdapter.addListener(
                        "event",
                        listeningClientListenerFn,
                    );
                    await publishingAdapter.addListener(
                        "event",
                        publishingClientListenerFn,
                    );

                    await publishingAdapter.dispatch("event", {
                        type: "event",
                    });

                    await delay(dispatchDelay);
                    expect(listeningClientListenerFn).toHaveBeenCalledTimes(1);
                    expect(listeningClientListenerFn).toHaveBeenCalledWith({
                        type: "event",
                    });
                    expect(publishingClientListenerFn).toHaveBeenCalledTimes(1);
                    expect(publishingClientListenerFn).toHaveBeenCalledWith({
                        type: "event",
                    });
                } finally {
                    await publishingAdapter.deInit();
                }
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

        describe("Transaction tests:", () => {
            let database: InstanceType<typeof Sqlite>;
            let transactionContext: TransactionContext<
                Kysely<any>,
                Kysely<any>
            >;
            let trxAwareAdapter: PostgresEventBusAdapter;

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
                trxAwareAdapter = new PostgresEventBusAdapter({
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
