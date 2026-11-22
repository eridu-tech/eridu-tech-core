import { randomUUID } from "node:crypto";

import { MongoClient } from "mongodb";
import {
    afterAll,
    beforeAll,
    beforeEach,
    describe,
    expect,
    test,
} from "vitest";

import { contextToken } from "@/execution-context/contracts/_module-exports.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";
import {
    LIMITER_POLICIES,
    RATE_LIMITER_STATE,
} from "@/rate-limiter/contracts/_module-exports.js";
import { MongdobRateLimiter } from "@/rate-limiter/implementations/adapters/mongodb-rate-limiter-adapter/mongodb-rate-limiter-adapter.js";
import { slidingWindowLimiterTestSuite } from "@/rate-limiter/implementations/test-utilities/_module-exports.js";
import { MongodbServer } from "@/test-utilities/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";
import { MongodbTransactionAdapter } from "@/transaction-context/implementations/adapters/mongodb-transaction-adapter/_module-exports.js";
import { TransactionContext } from "@/transaction-context/implementations/derivables/_module-exports.js";

import type { ClientSession, Db } from "mongodb";

import type { MongodbRateLimiterEntryDocument } from "@/rate-limiter/implementations/adapters/mongodb-rate-limiter-adapter/mongodb-rate-limiter-entry-document.js";
import type { ITransactionData } from "@/transaction-context/implementations/derivables/_module-exports.js";

const timeout = TimeSpan.fromMinutes(2);
describe(
    "sliding-window-limiter class: MongodbRateLimiterAdapter",
    { tags: ["Mongodb", "Adapters", "Implementations", "RateLimiter"] },
    () => {
        let client: MongoClient;
        const mongodbServer = new MongodbServer();
        let adapter: MongdobRateLimiter;
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
            adapter = new MongdobRateLimiter({
                database,
                collectionName,
                backoffPolicy:
                    slidingWindowLimiterTestSuite.backoffPolicySettings,
                rateLimiterPolicy:
                    slidingWindowLimiterTestSuite.rateLimiterPolicySettings,
            });
        });

        slidingWindowLimiterTestSuite({
            createAdapter: async () => {
                await adapter.init();
                return adapter;
            },
            beforeEach,
            describe,
            expect,
            test,
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
        describe("Expiration tests:", () => {
            const windowMs = TimeSpan.fromTimeSpan(
                slidingWindowLimiterTestSuite.rateLimiterPolicySettings.window,
            ).toMilliseconds();
            const marginMs = TimeSpan.fromTimeSpan(
                slidingWindowLimiterTestSuite.rateLimiterPolicySettings.margin,
            ).toMilliseconds();
            const backoffMs = TimeSpan.fromTimeSpan(
                slidingWindowLimiterTestSuite.backoffPolicySettings.delay,
            ).toMilliseconds();

            test("Should set expiration to the end of the next window plus margin when the attempt is allowed", async () => {
                await adapter.init();
                const collection =
                    database.collection<MongodbRateLimiterEntryDocument>(
                        collectionName,
                    );
                const key = "a";

                const state = await adapter.updateState(key, 4);

                const doc = await collection.findOne({ key });
                if (
                    doc === null ||
                    doc.data.type !== LIMITER_POLICIES.SLIDING_WINDOW
                ) {
                    throw new Error(
                        "Expected a stored sliding-window rate limiter document",
                    );
                }
                const storedState = doc.data.state;
                if (storedState.type !== RATE_LIMITER_STATE.ALLOWED) {
                    throw new Error("Expected an allowed rate limiter state");
                }

                const windowStart = Math.max(
                    ...Object.keys(storedState.metrics).map(Number),
                );

                expect(state.success).toBe(true);
                expect(state.resetTime).toEqual(doc.expiration);
                expect(doc.expiration.getTime()).toBe(
                    windowStart + windowMs * 2 + marginMs,
                );
            });
            test("Should set expiration to now plus backoff when the attempt is blocked", async () => {
                await adapter.init();
                const collection =
                    database.collection<MongodbRateLimiterEntryDocument>(
                        collectionName,
                    );
                const key = "a";
                await adapter.updateState(key, 2);

                const before = Date.now();
                const state = await adapter.updateState(key, 2);
                const after = Date.now();

                const doc = await collection.findOne({ key });
                if (doc === null) {
                    throw new Error("Expected a stored rate limiter document");
                }

                expect(state.success).toBe(false);
                expect(state.resetTime).toEqual(doc.expiration);
                expect(doc.data.type).toBe(LIMITER_POLICIES.SLIDING_WINDOW);
                expect(doc.data.state.type).toBe(RATE_LIMITER_STATE.BLOCKED);
                expect(doc.expiration.getTime()).toBeGreaterThanOrEqual(
                    before + backoffMs,
                );
                expect(doc.expiration.getTime()).toBeLessThanOrEqual(
                    after + backoffMs,
                );
            });
        });

        describe("Transaction tests:", () => {
            let trxAdapter: MongdobRateLimiter;
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
                trxAdapter = new MongdobRateLimiter({
                    database: trxCtx,
                    collectionName,
                    backoffPolicy:
                        slidingWindowLimiterTestSuite.backoffPolicySettings,
                    rateLimiterPolicy:
                        slidingWindowLimiterTestSuite.rateLimiterPolicySettings,
                });
                await trxAdapter.init();
            });
            test("Should not persist changes when the transaction fails", async () => {
                try {
                    await trxCtx.run(async () => {
                        await trxAdapter.updateState("a", 1);
                        await trxAdapter.updateState("b", 1);
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
                await trxAdapter.init();

                await trxCtx.run(async () => {
                    await trxAdapter.updateState("a", 1);
                    await trxAdapter.updateState("b", 1);
                });

                const collection = trxCtx.client.collection(collectionName);

                const docs = await collection.find().toArray();
                expect(docs.length).toBe(2);
            });
        });
    },
);
