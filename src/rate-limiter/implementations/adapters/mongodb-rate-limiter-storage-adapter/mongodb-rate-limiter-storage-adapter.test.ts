import { MongoClient } from "mongodb";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { contextToken } from "@/execution-context/contracts/_module.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import { MongodbRateLimiterStorageAdapter } from "@/rate-limiter/implementations/adapters/mongodb-rate-limiter-storage-adapter/_module.js";
import { rateLimiterStorageAdapterTestSuite } from "@/rate-limiter/implementations/test-utilities/_module.js";
import { SuperJsonSerdeAdapter } from "@/serde/implementations/adapters/_module.js";
import { Serde } from "@/serde/implementations/derivables/_module.js";
import { startMongoReplicaSet } from "@/test-utilities/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { MongodbTransactionAdapter } from "@/transaction-context/implementations/adapters/mongodb-transaction-adapter/_module.js";
import { TransactionContext } from "@/transaction-context/implementations/derivables/_module.js";

import type { StartedMongoDBContainer } from "@testcontainers/mongodb";
import type { ClientSession, Db } from "mongodb";

import type { MongodbRateLimiterDocument } from "@/rate-limiter/implementations/adapters/mongodb-rate-limiter-storage-adapter/_module.js";
import type { ITransactionContext } from "@/transaction-context/contracts/_module.js";

const timeout = TimeSpan.fromMinutes(2);
describe("class: MongodbRateLimiterStorageAdapter", () => {
    let client: MongoClient;
    let startedContainer: StartedMongoDBContainer;

    function createTrxCtx(
        client_: MongoClient,
        database: Db,
    ): ITransactionContext<Db, ClientSession> {
        return new TransactionContext({
            token: contextToken("mongodb"),
            executionContext: new ExecutionContext(
                new AlsExecutionContextAdapter(),
            ),
            adapter: new MongodbTransactionAdapter({
                client: client_,
                database,
            }),
        });
    }

    beforeEach(async () => {
        const { container, uri } = await startMongoReplicaSet();
        startedContainer = container;
        client = new MongoClient(uri, {
            directConnection: true,
        });
    }, timeout.toMilliseconds());
    afterEach(async () => {
        await client.close();
        await startedContainer.stop();
    }, timeout.toMilliseconds());
    rateLimiterStorageAdapterTestSuite({
        createAdapter: async () => {
            const adapter = new MongodbRateLimiterStorageAdapter({
                transactionContext: createTrxCtx(client, client.db("database")),
                collectionName: "rateLimiter",
                serde: new Serde(new SuperJsonSerdeAdapter()),
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
            const adapter = new MongodbRateLimiterStorageAdapter({
                transactionContext: createTrxCtx(client, client.db("database")),
                collectionName: "rateLimiter",
                serde: new Serde(new SuperJsonSerdeAdapter()),
            });
            await adapter.init();

            const promise = adapter.init();

            await expect(promise).resolves.toBeUndefined();
        });
    });
    describe("method: deInit", () => {
        test("Should remove collection", async () => {
            const adapter = new MongodbRateLimiterStorageAdapter({
                transactionContext: createTrxCtx(client, client.db("database")),
                collectionName: "rateLimiter",
                serde: new Serde(new SuperJsonSerdeAdapter()),
            });
            await adapter.init();
            await adapter.deInit();

            const collections = await client
                .db("database")
                .listCollections()
                .toArray();

            const collection = collections.find(
                (collection_) => collection_.name === "rateLimiter",
            );

            expect(collection).toBeUndefined();
        });
        test("Should not throw error when called multiple times", async () => {
            const adapter = new MongodbRateLimiterStorageAdapter({
                transactionContext: createTrxCtx(client, client.db("database")),
                collectionName: "rateLimiter",
                serde: new Serde(new SuperJsonSerdeAdapter()),
            });
            await adapter.init();
            await adapter.deInit();

            const promise = adapter.deInit();

            await expect(promise).resolves.toBeUndefined();
        });
        test("Should not throw error when called before init", async () => {
            const adapter = new MongodbRateLimiterStorageAdapter({
                transactionContext: createTrxCtx(client, client.db("database")),
                collectionName: "rateLimiter",
                serde: new Serde(new SuperJsonSerdeAdapter()),
            });

            const promise = adapter.deInit();

            await expect(promise).resolves.toBeUndefined();
        });
    });
    describe("Expiration tests:", () => {
        test("Should set expiration field to null when given no expiration", async () => {
            const database = client.db("database");
            const collectionName = "rateLimiter";
            const collection =
                database.collection<MongodbRateLimiterDocument>(collectionName);
            const adapter = new MongodbRateLimiterStorageAdapter({
                transactionContext: createTrxCtx(client, client.db("database")),
                collectionName: "rateLimiter",
                serde: new Serde(new SuperJsonSerdeAdapter()),
            });
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
            const database = client.db("database");
            const collectionName = "rateLimiter";
            const collection =
                database.collection<MongodbRateLimiterDocument>(collectionName);
            const adapter = new MongodbRateLimiterStorageAdapter({
                transactionContext: createTrxCtx(client, client.db("database")),
                collectionName: "rateLimiter",
                serde: new Serde(new SuperJsonSerdeAdapter()),
            });
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
            const trxCtx = createTrxCtx(client, client.db("database"));
            const collectionName = "circuit-breaker";
            const adapter = new MongodbRateLimiterStorageAdapter({
                transactionContext: trxCtx,
                collectionName,
                serde: new Serde(new SuperJsonSerdeAdapter()),
            });
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
    });
});
