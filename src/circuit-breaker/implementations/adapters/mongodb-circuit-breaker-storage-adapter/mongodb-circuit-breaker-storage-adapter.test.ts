import { MongoClient } from "mongodb";
import { describe, test, expect, beforeEach, afterEach } from "vitest";

import { MongodbCircuitBreakerStorageAdapter } from "@/circuit-breaker/implementations/adapters/mongodb-circuit-breaker-storage-adapter/mongodb-circuit-breaker-storage-adapter.js";
import { circuitBreakerStorageAdapterTestSuite } from "@/circuit-breaker/implementations/test-utilities/_module.js";
import { contextToken } from "@/execution-context/contracts/_module.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import { SuperJsonSerdeAdapter } from "@/serde/implementations/adapters/super-json-serde-adapter/_module.js";
import { Serde } from "@/serde/implementations/derivables/_module.js";
import { startMongoReplicaSet } from "@/test-utilities/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";
import { MongodbTransactionAdapter } from "@/transaction-context/implementations/adapters/mongodb-transaction-adapter/_module.js";
import { TransactionContext } from "@/transaction-context/implementations/derivables/_module.js";

import type { StartedMongoDBContainer } from "@testcontainers/mongodb";
import type { ClientSession, Db } from "mongodb";

import type { ITransactionContext } from "@/transaction-context/contracts/_module.js";

const timeout = TimeSpan.fromMinutes(2);
describe("class: MongodbCircuitBreakerStorageAdapter", () => {
    let client: MongoClient;
    let startedContainer: StartedMongoDBContainer;
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

    circuitBreakerStorageAdapterTestSuite({
        createAdapter: async () => {
            const adapter = new MongodbCircuitBreakerStorageAdapter({
                transactionContext: createTrxCtx(client, client.db("database")),
                collectionName: "circuitBreakers",
                serde: new Serde(new SuperJsonSerdeAdapter()),
            });
            await adapter.init();
            return adapter;
        },
        beforeEach,
        describe,
        test,
        expect,
    });
    describe("method: init", () => {
        test("Should not throw error when called multiple times", async () => {
            const databaseName = "database";
            const collectionName = "circuitBreakers";
            const adapter = new MongodbCircuitBreakerStorageAdapter({
                transactionContext: createTrxCtx(
                    client,
                    client.db(databaseName),
                ),
                collectionName,
                serde: new Serde(new SuperJsonSerdeAdapter()),
            });
            await adapter.init();

            const promise = adapter.init();

            await expect(promise).resolves.toBeUndefined();
        });
    });
    describe("method: deInit", () => {
        test("Should remove collection", async () => {
            const databaseName = "database";
            const collectionName = "circuitBreakers";
            const adapter = new MongodbCircuitBreakerStorageAdapter({
                transactionContext: createTrxCtx(
                    client,
                    client.db(databaseName),
                ),
                collectionName,
                serde: new Serde(new SuperJsonSerdeAdapter()),
            });
            await adapter.init();
            await adapter.deInit();

            const collections = await client
                .db(databaseName)
                .listCollections()
                .toArray();

            const collection = collections.find(
                (collection_) => collection_.name === "circuitBreakers",
            );

            expect(collection).toBeUndefined();
        });
        test("Should not throw error when called multiple times", async () => {
            const databaseName = "database";
            const collectionName = "circuitBreakers";
            const adapter = new MongodbCircuitBreakerStorageAdapter({
                transactionContext: createTrxCtx(
                    client,
                    client.db(databaseName),
                ),
                collectionName,
                serde: new Serde(new SuperJsonSerdeAdapter()),
            });
            await adapter.init();
            await adapter.deInit();

            const promise = adapter.deInit();

            await expect(promise).resolves.toBeUndefined();
        });
        test("Should not throw error when called before init", async () => {
            const databaseName = "database";
            const collectionName = "circuitBreakers";
            const adapter = new MongodbCircuitBreakerStorageAdapter({
                transactionContext: createTrxCtx(
                    client,
                    client.db(databaseName),
                ),
                collectionName,
                serde: new Serde(new SuperJsonSerdeAdapter()),
            });

            const promise = adapter.deInit();

            await expect(promise).resolves.toBeUndefined();
        });
    });
    describe("Transaction tests:", () => {
        test("Should not persist changes when the transaction fails", async () => {
            const trxCtx = createTrxCtx(client, client.db("database"));
            const collectionName = "circuit-breaker";
            const adapter = new MongodbCircuitBreakerStorageAdapter({
                transactionContext: trxCtx,
                collectionName,
                serde: new Serde(new SuperJsonSerdeAdapter()),
            });
            await adapter.init();

            try {
                await trxCtx.run(async () => {
                    await adapter.transaction(async (trx) => {
                        await trx.upsert("a", 1);
                        await trx.upsert("b", 1);
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
            const trxCtx = createTrxCtx(client, client.db("database"));
            const collectionName = "circuit-breaker";
            const adapter = new MongodbCircuitBreakerStorageAdapter({
                transactionContext: trxCtx,
                collectionName,
                serde: new Serde(new SuperJsonSerdeAdapter()),
            });
            await adapter.init();

            await trxCtx.run(async () => {
                await adapter.transaction(async (trx) => {
                    await trx.upsert("a", 1);
                    await trx.upsert("b", 1);
                });
            });

            const collection = trxCtx.client.collection(collectionName);

            const docs = await collection.find().toArray();
            expect(docs.length).toBe(2);
        });
    });
});
