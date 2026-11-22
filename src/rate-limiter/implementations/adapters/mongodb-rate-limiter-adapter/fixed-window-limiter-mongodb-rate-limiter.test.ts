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
import { MongdobRateLimiter } from "@/rate-limiter/implementations/adapters/mongodb-rate-limiter-adapter/mongodb-rate-limiter-adapter.js";
import { fixedWindowLimiterTestSuite } from "@/rate-limiter/implementations/test-utilities/_module-exports.js";
import { MongodbServer } from "@/test-utilities/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";
import { MongodbTransactionAdapter } from "@/transaction-context/implementations/adapters/mongodb-transaction-adapter/_module-exports.js";
import { TransactionContext } from "@/transaction-context/implementations/derivables/_module-exports.js";

import type { ClientSession, Db } from "mongodb";

import type { ITransactionData } from "@/transaction-context/implementations/derivables/_module-exports.js";

const timeout = TimeSpan.fromMinutes(2);
describe(
    "fixed-window-limiter class: MongodbRateLimiterAdapter",
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
                    fixedWindowLimiterTestSuite.backoffPolicySettings,
                rateLimiterPolicy:
                    fixedWindowLimiterTestSuite.rateLimiterPolicySettings,
            });
        });

        fixedWindowLimiterTestSuite({
            createAdapter: async () => {
                await adapter.init();
                return adapter;
            },
            beforeEach,
            describe,
            expect,
            test,
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
                        fixedWindowLimiterTestSuite.backoffPolicySettings,
                    rateLimiterPolicy:
                        fixedWindowLimiterTestSuite.rateLimiterPolicySettings,
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
