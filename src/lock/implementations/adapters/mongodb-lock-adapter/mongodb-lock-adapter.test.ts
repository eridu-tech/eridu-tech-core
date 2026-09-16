import { MongoDBContainer } from "@testcontainers/mongodb";
import { MongoClient } from "mongodb";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { contextToken } from "@/execution-context/contracts/_module.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import { MongodbLockAdapter } from "@/lock/implementations/adapters/mongodb-lock-adapter/mongodb-lock-adapter.js";
import { lockAdapterTestSuite } from "@/lock/implementations/test-utilities/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { MongodbTransactionAdapter } from "@/transaction-context/implementations/adapters/mongodb-transaction-adapter/_module.js";
import { TransactionContext } from "@/transaction-context/implementations/derivables/_module.js";

import type { StartedMongoDBContainer } from "@testcontainers/mongodb";
import type { ClientSession } from "mongodb";

import type { MongodbLockEntryDocument } from "@/lock/implementations/adapters/mongodb-lock-adapter/mongodb-lock-adapter.js";
import type { ITransactionData } from "@/transaction-context/implementations/derivables/_module.js";

const timeout = TimeSpan.fromMinutes(2);
describe("class: MongodbLockAdapter", () => {
    let client: MongoClient;
    let startedContainer: StartedMongoDBContainer;

    beforeEach(async () => {
        startedContainer = await new MongoDBContainer("mongo:5.0.0").start();
        client = new MongoClient(startedContainer.getConnectionString(), {
            directConnection: true,
        });
    }, timeout.toMilliseconds());
    afterEach(async () => {
        await client.close();
        await startedContainer.stop();
    }, timeout.toMilliseconds());
    lockAdapterTestSuite({
        createAdapter: async () => {
            const adapter = new MongodbLockAdapter({
                database: client.db("database"),
                collectionName: "locks",
            });
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
            const adapter = new MongodbLockAdapter({
                database: client.db("database"),
                collectionName: "locks",
            });
            await adapter.init();

            const promise = adapter.init();

            await expect(promise).resolves.toBeUndefined();
        });
    });
    describe("method: deInit", () => {
        test("Should remove collection", async () => {
            const adapter = new MongodbLockAdapter({
                database: client.db("database"),
                collectionName: "locks",
            });
            await adapter.init();
            await adapter.deInit();

            const collections = await client
                .db("database")
                .listCollections()
                .toArray();

            const collection = collections.find(
                (collection_) => collection_.name === "locks",
            );

            expect(collection).toBeUndefined();
        });
        test("Should not throw error when called multiple times", async () => {
            const adapter = new MongodbLockAdapter({
                database: client.db("database"),
                collectionName: "locks",
            });
            await adapter.init();
            await adapter.deInit();

            const promise = adapter.deInit();

            await expect(promise).resolves.toBeUndefined();
        });
        test("Should not throw error when called before init", async () => {
            const adapter = new MongodbLockAdapter({
                database: client.db("database"),
                collectionName: "locks",
            });

            const promise = adapter.deInit();

            await expect(promise).resolves.toBeUndefined();
        });
    });
    describe("Expiration tests:", () => {
        test("Should set expiration field to null when given no expiration", async () => {
            const database = client.db("database");
            const collectionName = "locks";
            const collection =
                database.collection<MongodbLockEntryDocument>(collectionName);
            const adapter = new MongodbLockAdapter({
                database,
                collectionName,
            });
            await adapter.init();

            const key = "a";
            const lockId = "1";
            const ttl = null;

            await adapter.acquire(key, lockId, ttl);

            const doc = await collection.findOne({
                key,
            });

            expect(doc).toEqual(
                expect.objectContaining({
                    expiration: null,
                } satisfies Partial<MongodbLockEntryDocument>),
            );
        });
        test("Should set expiration field to Date when given expiration", async () => {
            const database = client.db("database");
            const collectionName = "locks";
            const collection =
                database.collection<MongodbLockEntryDocument>(collectionName);
            const adapter = new MongodbLockAdapter({
                database,
                collectionName,
            });
            await adapter.init();

            const key = "a";
            const lockId = "1";
            const ttl = TimeSpan.fromMinutes(5);
            const expiration = ttl.toEndDate();

            await adapter.acquire(key, lockId, expiration);

            const doc = await collection.findOne({
                key,
            });
            expect(doc?.expiration).toEqual(expiration);
        });
    });
    describe("Transaction tests:", () => {
        test("Should not persist changes when the transaction fails", async () => {
            const database = client.db("database");
            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            const trxCtx = new TransactionContext({
                token: contextToken<ITransactionData<ClientSession>>("mongodb"),
                adapter: new MongodbTransactionAdapter({
                    database,
                    client,
                }),
                executionContext,
            });
            const collectionName = "circuit-breaker";
            const adapter = new MongodbLockAdapter({
                database: trxCtx,
                collectionName,
            });
            await adapter.init();

            try {
                await trxCtx.run(async () => {
                    await adapter.acquire("a", "1", null);
                    await adapter.acquire("b", "1", null);
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
            const database = client.db("database");
            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            const trxCtx = new TransactionContext({
                token: contextToken<ITransactionData<ClientSession>>("mongodb"),
                adapter: new MongodbTransactionAdapter({
                    database,
                    client,
                }),
                executionContext,
            });
            const collectionName = "circuit-breaker";
            const adapter = new MongodbLockAdapter({
                database: trxCtx,
                collectionName,
            });
            await adapter.init();

            await trxCtx.run(async () => {
                await adapter.acquire("a", "1", null);
                await adapter.acquire("b", "1", null);
            });

            const collection = trxCtx.client.collection(collectionName);

            const docs = await collection.find().toArray();
            expect(docs.length).toBe(2);
        });
    });
});
