import { randomUUID } from "node:crypto";

import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { Kysely, PostgresDialect } from "kysely";
import { Client, Pool } from "pg";
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

import type {
    BaseEvent,
    IEventBusAdapter,
} from "@/event-bus/contracts/_module-exports.js";
import type { ITransactionData } from "@/transaction-context/implementations/derivables/_module-exports.js";

const timeout = TimeSpan.fromMinutes(2);
const notificationTimeout = TimeSpan.fromMilliseconds(500);
describe(
    "class: PostgresEventBusAdapter",
    { tags: ["Postgres", "Adapters", "Implementations", "EventBus"] },
    () => {
        let container: StartedPostgreSqlContainer;
        let pool: Pool;
        let kysely: Kysely<any>;
        let clients: Array<Client>;
        let adapter: IEventBusAdapter;
        const serde = new SuperJsonSerde();

        const createClient = async (): Promise<Client> => {
            const client = new Client({
                host: container.getHost(),
                port: container.getPort(),
                database: container.getDatabase(),
                user: container.getUsername(),
                password: container.getPassword(),
            });
            await client.connect();
            clients.push(client);
            return client;
        };

        beforeAll(async () => {
            container = await new PostgreSqlContainer("postgres:17.5").start();
            pool = new Pool({
                host: container.getHost(),
                port: container.getPort(),
                database: container.getDatabase(),
                user: container.getUsername(),
                password: container.getPassword(),
                max: 10,
            });
            kysely = new Kysely({
                dialect: new PostgresDialect({
                    pool,
                }),
            });
        }, timeout.toMilliseconds());
        beforeEach(async () => {
            clients = [];
            adapter = withPlugin(
                new PostgresEventBusAdapter({
                    client: await createClient(),
                    serde,
                }),
                withEventBusPrefix(randomUUID()),
            );
        });
        afterEach(async () => {
            await Promise.all(clients.map((client) => client.end()));
            clients = [];
        });
        afterAll(async () => {
            await kysely.destroy();
            await container.stop();
        }, timeout.toMilliseconds());
        eventBusAdapterTestSuite({
            createAdapter: () => adapter,
            test,
            beforeEach,
            expect,
            describe,
        });

        describe("method: addListener, dispatch", () => {
            test("Should dispatch events between separate Postgres connections", async () => {
                const prefix = randomUUID();
                const listenerAdapter = withPlugin(
                    new PostgresEventBusAdapter({
                        client: await createClient(),
                        serde,
                    }),
                    withEventBusPrefix(prefix),
                );
                const dispatcherAdapter = withPlugin(
                    new PostgresEventBusAdapter({
                        client: await createClient(),
                        serde,
                    }),
                    withEventBusPrefix(prefix),
                );
                const listenerFn = vi.fn();

                await listenerAdapter.addListener("event", listenerFn);
                await dispatcherAdapter.dispatch("event", { type: "event" });

                await delay(notificationTimeout);
                expect(listenerFn).toHaveBeenCalledTimes(1);
                expect(listenerFn).toHaveBeenCalledWith({ type: "event" });
            });
        });

        describe("event names:", () => {
            test("Should support an empty event name", async () => {
                const emptyNameAdapter = new PostgresEventBusAdapter({
                    client: await createClient(),
                    serde,
                });
                const listenerFn = vi.fn();

                await emptyNameAdapter.addListener("", listenerFn);
                await emptyNameAdapter.dispatch("", { type: "event" });

                await delay(notificationTimeout);
                expect(listenerFn).toHaveBeenCalledTimes(1);
                expect(listenerFn).toHaveBeenCalledWith({ type: "event" });
            });

            test("Should support event names longer than the 63 byte channel name limit", async () => {
                const eventName = `event-${"x".repeat(100)}`;
                const longNameAdapter = new PostgresEventBusAdapter({
                    client: await createClient(),
                    serde,
                });
                const listenerFn = vi.fn();

                await longNameAdapter.addListener(eventName, listenerFn);
                await longNameAdapter.dispatch(eventName, { type: "event" });

                await delay(notificationTimeout);
                expect(listenerFn).toHaveBeenCalledTimes(1);
                expect(listenerFn).toHaveBeenCalledWith({ type: "event" });
            });
        });

        describe("channel subscription:", () => {
            const getListeningChannels = async (
                postgresClient: Client,
            ): Promise<Array<string>> => {
                const result = await postgresClient.query<{ channel: string }>(
                    "SELECT pg_listening_channels() AS channel",
                );
                return result.rows.map((row) => row.channel);
            };

            test("Should listen while there is at least one listener and unlisten when the last one is removed", async () => {
                const eventBusClient = await createClient();
                const eventBusAdapter = new PostgresEventBusAdapter({
                    client: eventBusClient,
                    serde,
                });
                const firstListenerFn = vi.fn((_event: BaseEvent) => {});
                const secondListenerFn = vi.fn((_event: BaseEvent) => {});

                expect(await getListeningChannels(eventBusClient)).toEqual([]);

                await eventBusAdapter.addListener("eventA", firstListenerFn);
                await eventBusAdapter.addListener("eventB", secondListenerFn);

                expect(await getListeningChannels(eventBusClient)).toHaveLength(
                    1,
                );

                await eventBusAdapter.removeListener("eventA", firstListenerFn);

                expect(await getListeningChannels(eventBusClient)).toHaveLength(
                    1,
                );

                await eventBusAdapter.removeListener(
                    "eventB",
                    secondListenerFn,
                );

                expect(await getListeningChannels(eventBusClient)).toEqual([]);
            });

            test("Should use the configured channel name", async () => {
                const channelName = `channel-${randomUUID()}`;
                const listenerClient = await createClient();
                const dispatcherClient = await createClient();
                const listeningAdapter = new PostgresEventBusAdapter({
                    client: listenerClient,
                    serde,
                    channelName,
                });
                const dispatchingAdapter = new PostgresEventBusAdapter({
                    client: dispatcherClient,
                    serde,
                    channelName,
                });
                const listenerFn = vi.fn();

                await listeningAdapter.addListener("event", listenerFn);

                expect(await getListeningChannels(listenerClient)).toEqual([
                    channelName,
                ]);

                await dispatchingAdapter.dispatch("event", { type: "event" });

                await delay(notificationTimeout);
                expect(listenerFn).toHaveBeenCalledTimes(1);
                expect(listenerFn).toHaveBeenCalledWith({ type: "event" });
            });
        });

        describe("setting: transactionHooks", () => {
            const createTransactionContext = () =>
                new TransactionContext({
                    token: contextToken<ITransactionData<Kysely<any>>>(
                        "kysely",
                    ),
                    adapter: new KyselyTransactionAdapter({
                        database: kysely,
                    }),
                    executionContext: new ExecutionContext(
                        new AlsExecutionContextAdapter(),
                    ),
                });

            const createAdapters = async (prefix: string) => {
                const transactionContext = createTransactionContext();
                return {
                    transactionContext,
                    listenerAdapter: withPlugin(
                        new PostgresEventBusAdapter({
                            client: await createClient(),
                            serde,
                        }),
                        withEventBusPrefix(prefix),
                    ),
                    dispatcherAdapter: withPlugin(
                        new PostgresEventBusAdapter({
                            client: await createClient(),
                            serde,
                            transactionHooks: transactionContext,
                        }),
                        withEventBusPrefix(prefix),
                    ),
                };
            };

            test("Should not dispatch when the transaction is rolled back", async () => {
                const {
                    transactionContext,
                    listenerAdapter,
                    dispatcherAdapter,
                } = await createAdapters(randomUUID());
                const listenerFn = vi.fn();
                await listenerAdapter.addListener("event", listenerFn);

                try {
                    await transactionContext.run(async () => {
                        await dispatcherAdapter.dispatch("event", {
                            data: "A",
                        });
                        throw new Error("Transaction failed");
                    });
                } catch {
                    /* EMPTY */
                }

                await delay(notificationTimeout);
                expect(listenerFn).not.toHaveBeenCalled();
            });

            test("Should dispatch after the transaction commits", async () => {
                const {
                    transactionContext,
                    listenerAdapter,
                    dispatcherAdapter,
                } = await createAdapters(randomUUID());
                const listenerFn = vi.fn();
                await listenerAdapter.addListener("event", listenerFn);

                await transactionContext.run(async () => {
                    await dispatcherAdapter.dispatch("event", { data: "A" });
                });

                await delay(notificationTimeout);
                expect(listenerFn).toHaveBeenCalledTimes(1);
                expect(listenerFn).toHaveBeenCalledWith({ data: "A" });
            });
        });
    },
);
