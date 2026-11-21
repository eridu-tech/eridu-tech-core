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
import { MongodbRateLimiterStorageAdapter } from "@/rate-limiter/implementations/adapters/mongodb-rate-limiter-storage-adapter/_module-exports.js";
import { rateLimiterStorageAdapterTestSuite } from "@/rate-limiter/implementations/test-utilities/_module-exports.js";
import { SuperJsonSerde } from "@/serde/implementations/super-json-serde/_module-exports.js";
import { MongodbServer } from "@/test-utilities/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";
import { MongodbTransactionAdapter } from "@/transaction-context/implementations/adapters/mongodb-transaction-adapter/_module-exports.js";
import { TransactionContext } from "@/transaction-context/implementations/derivables/_module-exports.js";

import type { ClientSession, Db } from "mongodb";

import type { MongodbRateLimiterDocument } from "@/rate-limiter/implementations/adapters/mongodb-rate-limiter-storage-adapter/_module-exports.js";
import type { ITransactionContext } from "@/transaction-context/contracts/_module-exports.js";

const timeout = TimeSpan.fromMinutes(2);
describe(
    "class: MongodbRateLimiterStorageAdapter",
    { tags: ["Mongodb", "Adapters", "Implementations", "RateLimiter"] },
    () => {
        let client: MongoClient;
        const mongodbServer = new MongodbServer();
        let adapter: MongodbRateLimiterStorageAdapter<unknown>;
        let database: Db;
        let collectionName: string;
        let trxCtx: ITransactionContext<Db, ClientSession>;

        beforeAll(async () => {
            await mongodbServer.init();
            client = new MongoClient(mongodbServer.getSettings().url, {
                directConnection: true,
            });
        }, timeout.toMilliseconds());
        afterAll(async () => {
            await client.close();
            await mongodbServer.deInit();
        }, timeout.toMilliseconds());
        beforeEach(() => {
            database = client.db("database");
            collectionName = randomUUID();
            trxCtx = new TransactionContext({
                token: contextToken("mongodb"),
                executionContext: new ExecutionContext(
                    new AlsExecutionContextAdapter(),
                ),
                adapter: new MongodbTransactionAdapter({
                    client,
                    database,
                }),
            });
            adapter = new MongodbRateLimiterStorageAdapter({
                transactionContext: trxCtx,
                collectionName,
                serde: new SuperJsonSerde(),
            });
        });
        rateLimiterStorageAdapterTestSuite({
            createAdapter: async () => {
                await adapter.init();
                return adapter;
            },
            test,
            beforeEach,
            expect,
            describe,
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

                const collections = await client
                    .db("database")
                    .listCollections()
                    .toArray();

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
            test("Should set expiration field to null when given no expiration", async () => {
                const collection =
                    database.collection<MongodbRateLimiterDocument>(
                        collectionName,
                    );
                await adapter.init();

                const key = "a";
                const state = "1";
                const ttl = TimeSpan.fromSeconds(1).toEndDate();

                await adapter.transaction(async (trx) => {
                    await trx.upsert(key, state, ttl);
                });

                const doc = await collection.findOne({
                    key,
                });

                expect(doc).toEqual(
                    expect.objectContaining({
                        expiration: ttl,
                    } satisfies Partial<MongodbRateLimiterDocument>),
                );
            });
            test("Should set expiration field to Date when given expiration", async () => {
                const collection =
                    database.collection<MongodbRateLimiterDocument>(
                        collectionName,
                    );
                await adapter.init();

                const key = "a";
                const state = "1";
                const ttl = TimeSpan.fromMinutes(5);
                const expiration = ttl.toEndDate();

                await adapter.transaction(async (trx) => {
                    await trx.upsert(key, state, expiration);
                });

                const doc = await collection.findOne({
                    key,
                });
                expect(doc?.expiration).toEqual(expiration);
            });
        });
        describe("Transaction tests:", () => {
            test("Should not persist changes when the transaction fails", async () => {
                await adapter.init();

                try {
                    await trxCtx.run(async () => {
                        await adapter.transaction(async (trx) => {
                            await trx.upsert("a", 1, new Date());
                            await trx.upsert("b", 1, new Date());
                        });
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
                await adapter.init();

                await trxCtx.run(async () => {
                    await adapter.transaction(async (trx) => {
                        await trx.upsert("a", 1, new Date());
                        await trx.upsert("b", 1, new Date());
                    });
                });

                const collection = trxCtx.client.collection(collectionName);

                const docs = await collection.find().toArray();
                expect(docs.length).toBe(2);
            });
        });
    },
);
