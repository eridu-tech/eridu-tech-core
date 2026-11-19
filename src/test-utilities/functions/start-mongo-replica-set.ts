import { MongoDBContainer } from "@testcontainers/mongodb";
import { MongoClient, MongoError } from "mongodb";

import type { StartedMongoDBContainer } from "@testcontainers/mongodb";

export async function startMongoReplicaSet(): Promise<{
    container: StartedMongoDBContainer;
    uri: string;
}> {
    const container = await new MongoDBContainer("mongo:6.0").start();
    try {
        const setupUri = `${container.getConnectionString()}?directConnection=true`;
        const client = new MongoClient(setupUri);
        try {
            await client.connect();
            const admin = client.db("admin");
            try {
                await admin.command({
                    replSetInitiate: {
                        _id: "rs0",
                        members: [{ _id: 0, host: "localhost:27017" }],
                    },
                });
            } catch (error: unknown) {
                if (!(
                    error instanceof MongoError &&
                    error.code === 23 &&
                    error.message.includes("already initialized")
                )) {
                    throw error;
                }
            }
            const deadline = Date.now() + 30_000;
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, no-constant-condition
            while (true) {
                const res = await admin.command({ hello: 1 });
                const isPrimary = Boolean(
                    res["isWritablePrimary"] ?? res["ismaster"],
                );
                if (isPrimary) break;
                if (Date.now() >= deadline) {
                    throw new Error(
                        "Timed out waiting for MongoDB replica set primary",
                    );
                }
                await new Promise((resolve) => setTimeout(resolve, 100));
            }
        } finally {
            await client.close();
        }
        return {
            container,
            uri: `${container.getConnectionString()}?replicaSet=rs0&directConnection=true`,
        };
    } catch (error) {
        await container.stop();
        throw error;
    }
}
