import { MongoClient } from "mongodb";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { MongodbServer } from "@/test-utilities/servers/mongodb-server/mongodb-server.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";

const timeout = TimeSpan.fromMinutes(3);

describe("class: MongodbServer", { tags: ["Mongodb", "TestUtilities"] }, () => {
    const server = new MongodbServer();
    let client: MongoClient;
    beforeAll(async () => {
        await server.init();
        client = new MongoClient(server.getSettings().url);
        await client.connect();
    }, timeout.toMilliseconds());
    afterAll(async () => {
        await client.close();
        await server.deInit();
    }, timeout.toMilliseconds());

    test("Should commit a transaction", async () => {
        const collection = client.db("test").collection("probe");
        const session = client.startSession();
        try {
            await session.withTransaction(async () => {
                await collection.insertOne({ id: 1 }, { session });
            });
        } finally {
            await session.endSession();
        }

        await expect(collection.findOne({ id: 1 })).resolves.toEqual(
            expect.objectContaining({ id: 1 }),
        );
    });

    test("Should throw when getSettings is called before init", () => {
        expect(() => new MongodbServer().getSettings()).toThrow();
    });
});
