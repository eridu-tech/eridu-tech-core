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

import type { IEventBusAdapter } from "@/event-bus/contracts/_module-exports.js";
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
