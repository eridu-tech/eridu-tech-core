import { MongoDBContainer } from "@testcontainers/mongodb";
import { MongoClient, MongoError } from "mongodb";

import { TimeSpan } from "@/time-span/implementations/_module-exports.js";
import { UnexpectedError } from "@/utilities/_module-exports.js";

import type { StartedMongoDBContainer } from "@testcontainers/mongodb";

import type { ITestServer } from "@/test-utilities/servers/_shared.js";

/**
 * @internal
 */
export type MongodbServerSettings = {
    /**
     * @default "mongo:6.0"
     */
    IMAGE?: string;

    /**
     * @default
     * ```ts
     * import { TimeSpan } from "eridu-tech/time-span";
     *
     * TimeSpan.fromMinutes(2);
     * ```
     */
    startupTimeout?: TimeSpan;
};

/**
 * @internal
 */
export type MongodbServerConnectionSettings = {
    url: string;
};

/**
 * @internal
 */
export class MongodbServer implements ITestServer<MongodbServerConnectionSettings> {
    private static readonly REPLICA_SET_NAME = "rs0";
    private startedContainer: StartedMongoDBContainer | null = null;
    private uri: string | null = null;
    private readonly settings: Required<MongodbServerSettings>;

    constructor(settings: MongodbServerSettings = {}) {
        const {
            IMAGE = "mongo:6.0",
            startupTimeout = TimeSpan.fromMinutes(2),
        } = settings;

        this.settings = {
            IMAGE,
            startupTimeout,
        };
    }

    // A single-node replica set is required for transactions to work.
    private static async initReplicaSet(
        container: StartedMongoDBContainer,
        startupTimeout: TimeSpan,
    ): Promise<void> {
        const setupUri = `${container.getConnectionString()}?directConnection=true`;
        const client = new MongoClient(setupUri);
        try {
            await client.connect();
            const admin = client.db("admin");
            try {
                await admin.command({
                    replSetInitiate: {
                        _id: MongodbServer.REPLICA_SET_NAME,
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
            const deadline = Date.now() + startupTimeout.toMilliseconds();
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
    }

    async init(): Promise<void> {
        const container = await new MongoDBContainer(
            this.settings.IMAGE,
        ).start();
        try {
            await MongodbServer.initReplicaSet(
                container,
                this.settings.startupTimeout,
            );
        } catch (error) {
            await container.stop();
            throw error;
        }
        this.startedContainer = container;
        this.uri = `${container.getConnectionString()}?replicaSet=${MongodbServer.REPLICA_SET_NAME}&directConnection=true`;
    }

    async deInit(): Promise<void> {
        await this.startedContainer?.stop();
    }

    getSettings(): MongodbServerConnectionSettings {
        if (this.uri === null) {
            throw UnexpectedError.create(
                "MongodbServer.init() must be called before using the server",
            );
        }
        return { url: this.uri };
    }
}
