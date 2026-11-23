import { randomUUID } from "node:crypto";

import { MongoClient } from "mongodb";
import {
    afterAll,
    beforeAll,
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from "vitest";

import {
    BREAKER_POLICIES,
    CIRCUIT_BREAKER_STATE,
} from "@/circuit-breaker/contracts/_module-exports.js";
import { MongodbCircuitBreakerAdapter } from "@/circuit-breaker/implementations/adapters/mongodb-circuit-breaker-adapter/_module-exports.js";
import { samplingBreakerTestSuite } from "@/circuit-breaker/implementations/test-utilities/_module-exports.js";
import { contextToken } from "@/execution-context/contracts/_module-exports.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";
import { MongodbServer } from "@/test-utilities/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";
import { MongodbTransactionAdapter } from "@/transaction-context/implementations/adapters/mongodb-transaction-adapter/_module-exports.js";
import { TransactionContext } from "@/transaction-context/implementations/derivables/_module-exports.js";

import type { ClientSession, Db } from "mongodb";

import type { MongodbCircuitBreakerEntryDocument } from "@/circuit-breaker/implementations/adapters/mongodb-circuit-breaker-adapter/mongodb-circuit-breaker-entry-document.js";
import type { ITransactionData } from "@/transaction-context/implementations/derivables/_module-exports.js";

const timeout = TimeSpan.fromMinutes(2);

// The sampling suite needs hundreds of calls to reach the minimum rate, and every call
// is a database round trip, so the default per test timeout is too small here.
vi.setConfig({ testTimeout: 30_000, hookTimeout: 30_000 });

describe(
    "sampling-breaker class: MongodbCircuitBreakerAdapter",
    { tags: ["Mongodb", "Adapters", "Implementations", "CircuitBreaker"] },
    () => {
        let client: MongoClient;
        const mongodbServer = new MongodbServer();
        let adapter: MongodbCircuitBreakerAdapter;
        let database: Db;
        let collectionName: string;

        beforeAll(async () => {
            await mongodbServer.init();
            client = new MongoClient(mongodbServer.getSettings().url, {
                directConnection: true,
            });
            await client.connect();
        }, timeout.toMilliseconds());
        afterAll(async () => {
            await client.close();
            await mongodbServer.deInit();
        }, timeout.toMilliseconds());
        beforeEach(() => {
            database = client.db("database");
            collectionName = randomUUID();
            adapter = new MongodbCircuitBreakerAdapter({
                database,
                collectionName,
                backoffPolicy: samplingBreakerTestSuite.backoffPolicySettings,
                circuitBreakerPolicy:
                    samplingBreakerTestSuite.circuitBreakerPolicySettings,
            });
        });

        samplingBreakerTestSuite({
            createAdapter: async () => {
                await adapter.init();
                return adapter;
            },
            beforeEach,
            describe,
            expect,
            test,
        });

        describe("Document tests:", () => {
            test("Should store a single document per key", async () => {
                await adapter.init();
                const collection =
                    database.collection<MongodbCircuitBreakerEntryDocument>(
                        collectionName,
                    );
                const key = "a";

                await adapter.trackFailure(key);
                await adapter.trackFailure(key);
                await adapter.updateState(key);

                const docs = await collection.find({ key }).toArray();

                expect(docs.length).toBe(1);
                expect(docs[0]?.data.type).toBe(BREAKER_POLICIES.SAMPLING);
            });
            test("Should keep the metrics of the tracked calls", async () => {
                await adapter.init();
                const collection =
                    database.collection<MongodbCircuitBreakerEntryDocument>(
                        collectionName,
                    );
                const key = "a";

                await adapter.trackFailure(key);
                await adapter.trackFailure(key);
                await adapter.trackSuccess(key);

                const doc = await collection.findOne({ key });
                if (
                    doc === null ||
                    doc.data.type !== BREAKER_POLICIES.SAMPLING ||
                    doc.data.state.type !== CIRCUIT_BREAKER_STATE.CLOSED
                ) {
                    throw new Error(
                        "Expected a stored closed sampling breaker state",
                    );
                }

                expect(doc.data.state.metrics.samples.length).toBe(1);
                expect(doc.data.state.metrics.samples[0]?.failures).toBe(2);
                expect(doc.data.state.metrics.samples[0]?.successes).toBe(1);
            });
        });

        describe("method: init", () => {
            test("Should not throw error when called multiple times", async () => {
                await adapter.init();

                const promise = adapter.init();

                await expect(promise).resolves.toBeUndefined();
            });
        });
        describe("method: deInit", () => {
            test("Should remove collection", async () => {
                await adapter.init();
                await adapter.deInit();

                const collections = await database.listCollections().toArray();

                const collection = collections.find(
                    (collection_) => collection_.name === collectionName,
                );

                expect(collection).toBeUndefined();
            });
            test("Should not throw error when called multiple times", async () => {
                await adapter.init();
                await adapter.deInit();

                const promise = adapter.deInit();

                await expect(promise).resolves.toBeUndefined();
            });
            test("Should not throw error when called before init", async () => {
                const promise = adapter.deInit();

                await expect(promise).resolves.toBeUndefined();
            });
        });
        describe("Transaction tests:", () => {
            let trxAdapter: MongodbCircuitBreakerAdapter;
            let trxCtx: TransactionContext<Db, ClientSession>;
            beforeEach(async () => {
                const executionContext = new ExecutionContext(
                    new AlsExecutionContextAdapter(),
                );
                trxCtx = new TransactionContext({
                    token: contextToken<ITransactionData<ClientSession>>(
                        "mongodb",
                    ),
                    adapter: new MongodbTransactionAdapter({
                        database,
                        client,
                    }),
                    executionContext,
                });
                trxAdapter = new MongodbCircuitBreakerAdapter({
                    database: trxCtx,
                    collectionName,
                    backoffPolicy:
                        samplingBreakerTestSuite.backoffPolicySettings,
                    circuitBreakerPolicy:
                        samplingBreakerTestSuite.circuitBreakerPolicySettings,
                });
                await trxAdapter.init();
            });
            test("Should not persist changes when the transaction fails", async () => {
                try {
                    await trxCtx.run(async () => {
                        await trxAdapter.trackFailure("a");
                        await trxAdapter.updateState("a");
                        throw new Error("Transaction failure");
                    });
                } catch {
                    /* EMPTY */
                }

                const collection = trxCtx.client.collection(collectionName);

                const docs = await collection.find().toArray();
                expect(docs.length).toBe(0);
            });
            test("Should persist changes when the transaction succeeds", async () => {
                await trxCtx.run(async () => {
                    await trxAdapter.trackFailure("a");
                    await trxAdapter.updateState("b");
                });

                const collection = trxCtx.client.collection(collectionName);

                const docs = await collection.find().toArray();
                expect(docs.length).toBe(2);
            });
        });
    },
);
