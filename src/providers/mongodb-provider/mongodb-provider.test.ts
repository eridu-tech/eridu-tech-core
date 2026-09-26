import { MongoDBContainer } from "@testcontainers/mongodb";
import { MongoClient, ObjectId } from "mongodb";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { Container } from "@/di/implementations/eager/container.js";
import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import {
    mongodbProvider,
    MONGODB_CLIENT,
} from "@/providers/mongodb-provider/mongodb-provider.js";
import { TimeSpan } from "@/time-span/implementations/_module.js";

import type { StartedMongoDBContainer } from "@testcontainers/mongodb";

import type { IContainer } from "@/di/contracts/container.contract.js";
import type { MongodbProviderSettings } from "@/providers/mongodb-provider/mongodb-provider.js";

const timeout = TimeSpan.fromMinutes(2);

describe("function: mongodbProvider", () => {
    let container: IContainer;
    let settings: MongodbProviderSettings;
    let startedContainer: StartedMongoDBContainer;

    beforeEach(async () => {
        startedContainer = await new MongoDBContainer("mongo:5.0.0").start();
        settings = {
            url: startedContainer.getConnectionString(),
            directConnection: true,
        };
        container = new Container({
            executionContext: new ExecutionContext(
                new NoOpExecutionContextAdapter(),
            ),
        });
    }, timeout.toMilliseconds());
    afterEach(async () => {
        vi.restoreAllMocks();
        await startedContainer.stop();
    }, timeout.toMilliseconds());

    describe("method: init", () => {
        test("Should resolve the mongodb client", async () => {
            container.registerProvider(mongodbProvider(settings));

            await container.init();

            const client = await container.resolveOrFail(MONGODB_CLIENT);
            expect(client).toBeInstanceOf(MongoClient);

            await container.deInit();
        });
        test("Should allow using the client before deInit", async () => {
            container.registerProvider(mongodbProvider(settings));
            await container.init();

            const client = await container.resolveOrFail(MONGODB_CLIENT);
            const collection = client.db("test").collection("coll");
            const id = new ObjectId();
            await collection.insertOne({ _id: id, value: 1 });

            const document = await collection.findOne({ _id: id });

            expect(document).toEqual({ _id: id, value: 1 });

            await container.deInit();
        });
        test("Should connect the client on init by default", async () => {
            const connectSpy = vi.spyOn(MongoClient.prototype, "connect");
            container.registerProvider(mongodbProvider(settings));

            await container.init();

            expect(connectSpy).toHaveBeenCalledOnce();

            await container.deInit();
        });
        test("Should connect the client lazily when eagerConnect is false", async () => {
            const connectSpy = vi.spyOn(MongoClient.prototype, "connect");
            container.registerProvider(
                mongodbProvider({ ...settings, eagerConnect: false }),
            );

            await container.init();

            expect(connectSpy).not.toHaveBeenCalled();

            const client = await container.resolveOrFail(MONGODB_CLIENT);
            const collection = client.db("test").collection("coll");
            const id = new ObjectId();
            await collection.insertOne({ _id: id, value: 1 });

            const document = await collection.findOne({ _id: id });

            expect(document).toEqual({ _id: id, value: 1 });
            expect(connectSpy).toHaveBeenCalledOnce();

            await container.deInit();
        });
    });

    describe("method: deInit", () => {
        test("Should close the client", async () => {
            container.registerProvider(mongodbProvider(settings));
            await container.init();

            const client = await container.resolveOrFail(MONGODB_CLIENT);
            const collection = client.db("test").collection("coll");

            await container.deInit();

            await expect(
                collection.insertOne({ _id: new ObjectId(), value: 1 }),
            ).rejects.toThrow();
        });
    });
});
