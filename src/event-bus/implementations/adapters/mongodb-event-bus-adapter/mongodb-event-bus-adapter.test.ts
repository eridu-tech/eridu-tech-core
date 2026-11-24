import { randomUUID } from "node:crypto";

import Sqlite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import { MongoClient } from "mongodb";
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

import { MongodbEventBusAdapter } from "@/event-bus/implementations/adapters/mongodb-event-bus-adapter/mongodb-event-bus-adapter.js";
import { withEventBusPrefix } from "@/event-bus/implementations/plugins/_module-exports.js";
import { eventBusAdapterTestSuite } from "@/event-bus/implementations/test-utilities/_module-exports.js";
import { contextToken } from "@/execution-context/contracts/_module-exports.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";
import { withPlugin } from "@/middleware/implementations/_module-exports.js";
import { SuperJsonSerde } from "@/serde/implementations/super-json-serde/_module-exports.js";
import { MongodbServer } from "@/test-utilities/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";
import { KyselyTransactionAdapter } from "@/transaction-context/implementations/adapters/kysely-transaction-adapter/kysely-transaction-adapter.js";
import { MongodbTransactionAdapter } from "@/transaction-context/implementations/adapters/mongodb-transaction-adapter/_module-exports.js";
import { TransactionContext } from "@/transaction-context/implementations/derivables/_module-exports.js";
import { delay } from "@/utilities/_module-exports.js";

import type { ClientSession, Db } from "mongodb";

import type { ITransactionData } from "@/transaction-context/implementations/derivables/_module-exports.js";

const timeout = TimeSpan.fromMinutes(2);
const dispatchDelay = TimeSpan.fromMilliseconds(500);
describe(
    "class: MongodbEventBusAdapter",
    { tags: ["Mongodb", "Adapters", "Implementations", "EventBus"] },
    () => {
        const mongodbServer = new MongodbServer();
        let client: MongoClient;
        let database: Db;
        let collectionName: string;
        let adapter: MongodbEventBusAdapter;
        const serde = new SuperJsonSerde();

        beforeAll(async () => {
            client = new MongoClient(mongodbServer.getSettings().url, {
                directConnection: true,
            });
            await client.connect();
        }, timeout.toMilliseconds());
        beforeEach(() => {
            database = client.db(`database_${randomUUID()}`);
            collectionName = randomUUID();
            adapter = withPlugin(
                new MongodbEventBusAdapter({
                    database,
                    serde,
                    collectionName,
                }),
                withEventBusPrefix(randomUUID()),
            );
        });
        afterEach(async () => {
            await adapter.deInit();
            await database.dropDatabase();
        });
        afterAll(async () => {
            await client.close();
            await mongodbServer.deInit();
        }, timeout.toMilliseconds());
        eventBusAdapterTestSuite({
            createAdapter: () => adapter,
            test,
            beforeEach,
            expect,
            describe,
        });

        describe("method: addListener, dispatch", () => {
            let prefixlessAdapter: MongodbEventBusAdapter;
            beforeEach(() => {
                prefixlessAdapter = new MongodbEventBusAdapter({
                    database,
                    serde,
                    collectionName,
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

            test("Should deliver events inserted directly into the collection", async () => {
                const listenerFn = vi.fn();
                await prefixlessAdapter.addListener("event", listenerFn);

                await database.collection(collectionName).insertOne({
                    eventName: "event",
                    eventData: serde.serialize({ type: "event" }),
                });

                await delay(dispatchDelay);
                expect(listenerFn).toHaveBeenCalledTimes(1);
                expect(listenerFn).toHaveBeenCalledWith({ type: "event" });
            });

            test("Should not deliver documents inserted into another collection", async () => {
                const listenerFn = vi.fn();
                await prefixlessAdapter.addListener("event", listenerFn);

                await database.collection(`other_${randomUUID()}`).insertOne({
                    eventName: "event",
                    eventData: serde.serialize({ type: "event" }),
                });

                await delay(dispatchDelay);
                expect(listenerFn).not.toHaveBeenCalled();
            });

            test("Should deliver events between separate adapters", async () => {
                const publishingAdapter = new MongodbEventBusAdapter({
                    database,
                    serde,
                    collectionName,
                });
                try {
                    const listenerFn = vi.fn();
                    await prefixlessAdapter.addListener("event", listenerFn);

                    await publishingAdapter.dispatch("event", {
                        type: "event",
                    });

                    await delay(dispatchDelay);
                    expect(listenerFn).toHaveBeenCalledTimes(1);
                    expect(listenerFn).toHaveBeenCalledWith({ type: "event" });
                } finally {
                    await publishingAdapter.deInit();
                }
            });
        });

        describe("method: deInit", () => {
            test("Should not throw when called multiple times", async () => {
                const listenerFn = vi.fn();
                await adapter.addListener("event", listenerFn);
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
            describe("Transaction aware tests:", () => {
                let transactionContext: TransactionContext<Db, ClientSession>;
                let trxDatabaseAdapter: MongodbEventBusAdapter;

                beforeEach(() => {
                    transactionContext = new TransactionContext<
                        Db,
                        ClientSession
                    >({
                        token: contextToken<ITransactionData<ClientSession>>(
                            "mongodb",
                        ),
                        adapter: new MongodbTransactionAdapter({
                            client,
                            database,
                        }),
                        executionContext: new ExecutionContext(
                            new AlsExecutionContextAdapter(),
                        ),
                    });
                    trxDatabaseAdapter = new MongodbEventBusAdapter({
                        database: transactionContext,
                        serde,
                        collectionName,
                    });
                });
                afterEach(async () => {
                    await trxDatabaseAdapter.deInit();
                });

                test("Should not insert events when the transaction fails", async () => {
                    const listenerFn = vi.fn();
                    await trxDatabaseAdapter.addListener("eventA", listenerFn);

                    try {
                        await transactionContext.run(async () => {
                            await trxDatabaseAdapter.dispatch("eventA", {
                                data: "A",
                            });
                            throw new Error("Transaction failed");
                        });
                    } catch {
                        /* EMPTY */
                    }

                    await delay(dispatchDelay);
                    expect(listenerFn).not.toHaveBeenCalled();
                    expect(
                        await database
                            .collection(collectionName)
                            .countDocuments(),
                    ).toBe(0);
                });

                test("Should insert events when the transaction commits", async () => {
                    const listenerFn = vi.fn();
                    await trxDatabaseAdapter.addListener("eventA", listenerFn);

                    await transactionContext.run(async () => {
                        await trxDatabaseAdapter.dispatch("eventA", {
                            data: "A",
                        });
                    });

                    await delay(dispatchDelay);
                    expect(listenerFn).toHaveBeenCalledTimes(1);
                    expect(listenerFn).toHaveBeenCalledWith({ data: "A" });
                    expect(
                        await database
                            .collection(collectionName)
                            .countDocuments(),
                    ).toBe(1);
                });
            });
            describe("afterCommit tests:", () => {
                let sqliteDatabase: InstanceType<typeof Sqlite>;
                let transactionContext: TransactionContext<
                    Kysely<any>,
                    Kysely<any>
                >;
                let trxAwareAdapter: MongodbEventBusAdapter;

                beforeEach(() => {
                    sqliteDatabase = new Sqlite(":memory:");
                    transactionContext = new TransactionContext({
                        token: contextToken<ITransactionData<Kysely<any>>>(
                            "kysely",
                        ),
                        adapter: new KyselyTransactionAdapter({
                            database: new Kysely({
                                dialect: new SqliteDialect({
                                    database: sqliteDatabase,
                                }),
                            }),
                        }),
                        executionContext: new ExecutionContext(
                            new AlsExecutionContextAdapter(),
                        ),
                    });
                    trxAwareAdapter = new MongodbEventBusAdapter({
                        database,
                        serde,
                        collectionName,
                        transactionHooks: transactionContext,
                    });
                });
                afterEach(async () => {
                    sqliteDatabase.close();
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
        });
    },
);
