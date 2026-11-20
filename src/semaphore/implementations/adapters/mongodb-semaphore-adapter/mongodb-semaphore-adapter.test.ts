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
import { MongodbSemaphoreAdapter } from "@/semaphore/implementations/adapters/mongodb-semaphore-adapter/mongodb-semaphore-adapter.js";
import { semaphoreAdapterTestSuite } from "@/semaphore/implementations/test-utilities/_module-exports.js";
import { MongodbServer } from "@/test-utilities/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";
import { MongodbTransactionAdapter } from "@/transaction-context/implementations/adapters/mongodb-transaction-adapter/_module-exports.js";
import { TransactionContext } from "@/transaction-context/implementations/derivables/_module-exports.js";

import type { ClientSession, Db } from "mongodb";

import type { MongodbSemaphoreEntryDocument } from "@/semaphore/implementations/adapters/mongodb-semaphore-adapter/mongodb-semaphore-adapter.js";
import type { ITransactionData } from "@/transaction-context/implementations/derivables/_module-exports.js";

const timeout = TimeSpan.fromMinutes(2);
describe("class: MongodbSemaphoreAdapter", { tags: ["Mongodb"] }, () => {
    let client: MongoClient;
    const mongodbServer = new MongodbServer();
    let adapter: MongodbSemaphoreAdapter;
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
        adapter = new MongodbSemaphoreAdapter({
            database,
            collectionName,
        });
    });
    semaphoreAdapterTestSuite({
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
        test("Should set expiration to null when slot is unexpireable", async () => {
            const collection =
                database.collection<MongodbSemaphoreEntryDocument>(
                    collectionName,
                );

            const key = "a";
            const slotId = "1";
            const ttl = null;
            const limit = 3;

            await adapter.acquire({
                key,
                ttl,
                slotId,
                limit,
            });

            const doc = await collection.findOne({ key });

            expect(doc).toEqual(
                expect.objectContaining({
                    expiration: null,
                } satisfies Partial<MongodbSemaphoreEntryDocument>),
            );
        });
        test("Should set expiration of the first acquired slot when slot is unexpired", async () => {
            const collection =
                database.collection<MongodbSemaphoreEntryDocument>(
                    collectionName,
                );

            const key = "a";
            const limit = 3;

            const slotId = "1";
            const ttl = TimeSpan.fromMinutes(4);
            const expiration = ttl.toEndDate();
            await adapter.acquire({
                key,
                ttl: expiration,
                slotId,
                limit,
            });

            const doc = await collection.findOne({ key });
            expect(doc?.expiration).toEqual(expiration);
        });
        test("Should set expiration to null when first slot is unexpireable and seconds slot is unexpired", async () => {
            const collection =
                database.collection<MongodbSemaphoreEntryDocument>(
                    collectionName,
                );

            const key = "a";
            const limit = 3;

            const slotId1 = "1";
            const ttl1 = null;
            await adapter.acquire({
                key,
                ttl: ttl1,
                slotId: slotId1,
                limit,
            });

            const slotId2 = "2";
            const ttl2 = TimeSpan.fromMinutes(5);
            await adapter.acquire({
                key,
                ttl: ttl2.toEndDate(),
                slotId: slotId2,
                limit,
            });

            const doc = await collection.findOne({ key });

            expect(doc).toEqual(
                expect.objectContaining({
                    expiration: null,
                } satisfies Partial<MongodbSemaphoreEntryDocument>),
            );
        });
        test("Should set expiration to null when first slot is unexpired and seconds slot is unexpireable", async () => {
            const collection =
                database.collection<MongodbSemaphoreEntryDocument>(
                    collectionName,
                );

            const key = "a";
            const limit = 3;

            const slotId1 = "1";
            const ttl1 = TimeSpan.fromMinutes(5);
            await adapter.acquire({
                key,
                ttl: ttl1.toEndDate(),
                slotId: slotId1,
                limit,
            });

            const slotId2 = "2";
            const ttl2 = null;
            await adapter.acquire({
                key,
                ttl: ttl2,
                slotId: slotId2,
                limit,
            });

            const doc = await collection.findOne({ key });

            expect(doc).toEqual(
                expect.objectContaining({
                    expiration: null,
                } satisfies Partial<MongodbSemaphoreEntryDocument>),
            );
        });
        test("Should set expiration to longest expiration when first slot is unexpired and seconds slot is unexpired and has longest expiration", async () => {
            const collection =
                database.collection<MongodbSemaphoreEntryDocument>(
                    collectionName,
                );

            const key = "a";
            const limit = 3;

            const slotId1 = "1";
            const ttl1 = TimeSpan.fromMinutes(5);
            await adapter.acquire({
                key,
                ttl: ttl1.toEndDate(),
                slotId: slotId1,
                limit,
            });

            const slotId2 = "2";
            const ttl2 = TimeSpan.fromMinutes(10);
            const expiration2 = ttl2.toEndDate();
            await adapter.acquire({
                key,
                ttl: expiration2,
                slotId: slotId2,
                limit,
            });

            const doc = await collection.findOne({ key });
            expect(doc?.expiration).toEqual(expiration2);
        });
        test("Should set expiration to longest expiration when first slot is unexpired and has longest expiration and seconds slot is unexpired", async () => {
            const collection =
                database.collection<MongodbSemaphoreEntryDocument>(
                    collectionName,
                );

            const key = "a";
            const limit = 3;

            const slotId1 = "1";
            const ttl1 = TimeSpan.fromMinutes(10);
            const expiration1 = ttl1.toEndDate();
            await adapter.acquire({
                key,
                ttl: expiration1,
                slotId: slotId1,
                limit,
            });

            const slotId2 = "2";
            const ttl2 = TimeSpan.fromMinutes(5);
            await adapter.acquire({
                key,
                ttl: ttl2.toEndDate(),
                slotId: slotId2,
                limit,
            });

            const doc = await collection.findOne({ key });
            expect(doc?.expiration).toEqual(expiration1);
        });
        test("Should set expiration to less than current date when each slot is individually removed", async () => {
            const collection =
                database.collection<MongodbSemaphoreEntryDocument>(
                    collectionName,
                );

            const key = "a";
            const limit = 3;

            const slotId1 = "1";
            const ttl1 = TimeSpan.fromMinutes(10);
            await adapter.acquire({
                key,
                ttl: ttl1.toEndDate(),
                slotId: slotId1,
                limit,
            });

            const slotId2 = "2";
            const ttl2 = TimeSpan.fromMinutes(5);
            await adapter.acquire({
                key,
                ttl: ttl2.toEndDate(),
                slotId: slotId2,
                limit,
            });

            await adapter.release(key, slotId1);
            await adapter.release(key, slotId2);

            const doc = await collection.findOne({ key });
            expect(doc?.expiration?.getTime()).toBeLessThan(Date.now());
        });
    });
    describe("Transaction tests:", () => {
        let trxAdapter: MongodbSemaphoreAdapter;
        let trxCtx: TransactionContext<Db, ClientSession>;
        beforeEach(async () => {
            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            trxCtx = new TransactionContext({
                token: contextToken<ITransactionData<ClientSession>>("mongodb"),
                adapter: new MongodbTransactionAdapter({
                    database,
                    client,
                }),
                executionContext,
            });
            trxAdapter = new MongodbSemaphoreAdapter({
                database: trxCtx,
                collectionName,
            });
            await trxAdapter.init();
        });
        test("Should not persist changes when the transaction fails", async () => {
            try {
                await trxCtx.run(async () => {
                    await trxAdapter.acquire({
                        key: "a",
                        slotId: "1",
                        limit: 4,
                        ttl: null,
                    });
                    await trxAdapter.acquire({
                        key: "b",
                        slotId: "1",
                        limit: 4,
                        ttl: null,
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
            await trxCtx.run(async () => {
                await trxAdapter.acquire({
                    key: "a",
                    slotId: "1",
                    limit: 4,
                    ttl: null,
                });
                await trxAdapter.acquire({
                    key: "b",
                    slotId: "1",
                    limit: 4,
                    ttl: null,
                });
            });

            const collection = trxCtx.client.collection(collectionName);

            const docs = await collection.find().toArray();
            expect(docs.length).toBe(2);
        });
    });
});
