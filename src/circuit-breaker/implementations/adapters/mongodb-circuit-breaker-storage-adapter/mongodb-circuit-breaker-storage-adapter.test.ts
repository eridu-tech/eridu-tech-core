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

import { MongodbCircuitBreakerStorageAdapter } from "@/circuit-breaker/implementations/adapters/mongodb-circuit-breaker-storage-adapter/mongodb-circuit-breaker-storage-adapter.js";
import { circuitBreakerStorageAdapterTestSuite } from "@/circuit-breaker/implementations/test-utilities/_module-exports.js";
import { contextToken } from "@/execution-context/contracts/_module-exports.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";
import { SuperJsonSerde } from "@/serde/implementations/super-json-serde/_module-exports.js";
import { MongodbServer } from "@/test-utilities/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";
import { MongodbTransactionAdapter } from "@/transaction-context/implementations/adapters/mongodb-transaction-adapter/_module-exports.js";
import { TransactionContext } from "@/transaction-context/implementations/derivables/_module-exports.js";

import type { ClientSession, Db } from "mongodb";

import type { ITransactionContext } from "@/transaction-context/contracts/_module-exports.js";

const timeout = TimeSpan.fromMinutes(2);
describe("class: MongodbCircuitBreakerStorageAdapter", { tags: ["Mongodb"] }, () => {
    let client: MongoClient;
    const mongodbServer = new MongodbServer();
    let adapter: MongodbCircuitBreakerStorageAdapter;
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
        adapter = new MongodbCircuitBreakerStorageAdapter({
            transactionContext: trxCtx,
            collectionName,
            serde: new SuperJsonSerde(),
        });
    });
    circuitBreakerStorageAdapterTestSuite({
        createAdapter: async () => {
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
    describe("Transaction tests:", () => {
        test("Should not persist changes when the transaction fails", async () => {
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
