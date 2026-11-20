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

import { MongodbCacheAdapter } from "@/cache/implementations/adapters/mongodb-cache-adapter/mongodb-cache-adapter.js";
import { cacheAdapterTestSuite } from "@/cache/implementations/test-utilities/_module-exports.js";
import { contextToken } from "@/execution-context/contracts/_module-exports.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";
import { SuperJsonSerde } from "@/serde/implementations/super-json-serde/_module-exports.js";
import { MongodbServer } from "@/test-utilities/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";
import { MongodbTransactionAdapter } from "@/transaction-context/implementations/adapters/mongodb-transaction-adapter/_module-exports.js";
import { TransactionContext } from "@/transaction-context/implementations/derivables/_module-exports.js";

import type { ClientSession, Db } from "mongodb";

import type { MongodbCacheEntryDocument } from "@/cache/implementations/adapters/mongodb-cache-adapter/mongodb-cache-adapter.js";
import type { ITransactionData } from "@/transaction-context/implementations/derivables/_module-exports.js";

const timeout = TimeSpan.fromMinutes(2);
describe("class: MongodbCacheAdapter", () => {
    let client: MongoClient;
    const mongodbServer = new MongodbServer();
    let adapter: MongodbCacheAdapter;
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
        adapter = new MongodbCacheAdapter({
            database,
            collectionName,
            serde: new SuperJsonSerde(),
        });
    });
    cacheAdapterTestSuite({
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
    describe("method: deInit:", () => {
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
        test("Should set expiration field to null when given no expiration", async () => {
            const collection =
                database.collection<MongodbCacheEntryDocument>(collectionName);
            await adapter.init();

            const key = "a";
            const lockId = "1";
            const ttl = null;

            await adapter.add(key, lockId, ttl);

            const doc = await collection.findOne({
                key,
            });

            expect(doc).toEqual(
                expect.objectContaining({
                    expiration: null,
                } satisfies Partial<MongodbCacheEntryDocument>),
            );
        });
        test("Should set expiration field to Date when given expiration", async () => {
            const collection =
                database.collection<MongodbCacheEntryDocument>(collectionName);
            await adapter.init();

            const key = "a";
            const lockId = "1";
            const ttl = TimeSpan.fromMinutes(5);
            const expiration = ttl.toEndDate();

            await adapter.add(key, lockId, expiration);

            const doc = await collection.findOne({
                key,
            });
            expect(doc?.expiration).toEqual(expiration);
        });
    });
    describe("Transaction tests:", () => {
        let trxAdapter: MongodbCacheAdapter;
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
            trxAdapter = new MongodbCacheAdapter({
                database: trxCtx,
                collectionName,
                serde: new SuperJsonSerde(),
            });
            await trxAdapter.init();
        });
        test("Should not persist changes when the transaction fails", async () => {
            try {
                await trxCtx.run(async () => {
                    await trxAdapter.add("a", 1, null);
                    await trxAdapter.add("b", 1, null);
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
                await trxAdapter.add("a", 1, null);
                await trxAdapter.add("b", 1, null);
            });

            const collection = trxCtx.client.collection(collectionName);

            const docs = await collection.find().toArray();
            expect(docs.length).toBe(2);
        });
    });
});
