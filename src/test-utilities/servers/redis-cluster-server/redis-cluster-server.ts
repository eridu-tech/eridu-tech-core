import { RedisContainer } from "@testcontainers/redis";
import { Redis } from "ioredis";
import { Network } from "testcontainers";

import { TimeSpan } from "@/time-span/implementations/_module-exports.js";
import { UnexpectedError } from "@/utilities/_module-exports.js";

import type { StartedRedisContainer } from "@testcontainers/redis";
import type { StartedNetwork } from "testcontainers";

import type { ITestServer } from "@/test-utilities/servers/_shared.js";

/**
 * @internal
 */
export type RedisClusterServerSettings = {
    /**
     * @default "redis:7.4.2"
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
export type RedisClusterServerNode = {
    host: string;
    port: number;
};

/**
 * @internal
 */
export type RedisClusterServerConnectionSettings = {
    /**
     * Host reachable addresses of the cluster nodes.
     * They can be used as the seed nodes of a cluster aware client.
     */
    nodes: Array<RedisClusterServerNode>;

    /**
     * Maps the address a node announces inside the container network to the
     * address which is reachable from the host.
     * It must be passed to the `natMap` option of a cluster aware client, e.g.
     * the ioredis `Cluster` class, otherwise the client cannot reach the nodes
     * it gets redirected to.
     */
    natMap: Record<string, RedisClusterServerNode>;
};

/**
 * @internal
 */
type RedisClusterServerNodeHandle = {
    client: Redis;
    internalAddress: string;
};

/**
 * @internal
 */
export class RedisClusterServer implements ITestServer<RedisClusterServerConnectionSettings> {
    private static readonly NODE_COUNT = 2;
    private static readonly REDIS_PORT = 6379;
    private static readonly SLOT_COUNT = 16_384;

    private startedNetwork: StartedNetwork | null = null;
    private startedContainers: Array<StartedRedisContainer> = [];
    private connectionSettings: RedisClusterServerConnectionSettings | null =
        null;
    private readonly settings: Required<RedisClusterServerSettings>;

    constructor(settings: RedisClusterServerSettings = {}) {
        const {
            IMAGE = "redis:7.4.2",
            startupTimeout = TimeSpan.fromMinutes(2),
        } = settings;

        this.settings = {
            IMAGE,
            startupTimeout,
        };
    }

    private async startNode(
        network: StartedNetwork,
        index: number,
    ): Promise<StartedRedisContainer> {
        return new RedisContainer(this.settings.IMAGE)
            .withNetwork(network)
            .withNetworkAliases(`redis-node-${String(index + 1)}`)
            .withCommand([
                "--cluster-enabled",
                "yes",
                "--cluster-node-timeout",
                "5000",
            ])
            .start();
    }

    private static createNodeHandles(
        network: StartedNetwork,
        containers: Array<StartedRedisContainer>,
    ): Array<RedisClusterServerNodeHandle> {
        const networkName = network.getName();
        return containers.map((container) => ({
            client: new Redis({
                host: "127.0.0.1",
                port: container.getMappedPort(RedisClusterServer.REDIS_PORT),
                lazyConnect: true,
            }),
            internalAddress: container.getIpAddress(networkName),
        }));
    }

    // `redis-cli --cluster create` refuses to create a cluster with less than
    // three masters, so the nodes are introduced to each other and the hash
    // slots are distributed manually.
    private static async createCluster(
        nodes: Array<RedisClusterServerNodeHandle>,
        startupTimeout: TimeSpan,
    ): Promise<void> {
        const seedNode = nodes[0];
        if (seedNode === undefined) {
            throw UnexpectedError.create(
                "At least one Redis cluster node is required",
            );
        }

        try {
            await Promise.all(
                nodes.map(async (node) => {
                    await node.client.connect();
                }),
            );

            const slotsPerNode = RedisClusterServer.SLOT_COUNT / nodes.length;
            for (const [index, node] of nodes.entries()) {
                if (node !== seedNode) {
                    await node.client.cluster(
                        "MEET",
                        seedNode.internalAddress,
                        RedisClusterServer.REDIS_PORT,
                    );
                }
                const firstSlot = index * slotsPerNode;
                const slots = Array.from(
                    { length: slotsPerNode },
                    (_, offset) => firstSlot + offset,
                );
                await node.client.cluster("ADDSLOTS", ...slots);
            }

            await RedisClusterServer.waitUntilClusterIsReady(
                nodes,
                startupTimeout,
            );
        } finally {
            await Promise.all(
                nodes.map(async (node) => await node.client.quit()),
            );
        }
    }

    private static async waitUntilClusterIsReady(
        nodes: Array<RedisClusterServerNodeHandle>,
        startupTimeout: TimeSpan,
    ): Promise<void> {
        const deadline = Date.now() + startupTimeout.toMilliseconds();
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, no-constant-condition
        while (true) {
            const clusterInfos = await Promise.all(
                nodes.map(async (node) => await node.client.cluster("INFO")),
            );
            const isReady = clusterInfos.every(
                (info) =>
                    info.includes("cluster_state:ok") &&
                    info.includes(
                        `cluster_known_nodes:${String(nodes.length)}`,
                    ),
            );
            if (isReady) {
                return;
            }
            if (Date.now() >= deadline) {
                throw UnexpectedError.create(
                    "Timed out waiting for the Redis cluster to form",
                );
            }
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
    }

    private static toConnectionSettings(
        network: StartedNetwork,
        containers: Array<StartedRedisContainer>,
    ): RedisClusterServerConnectionSettings {
        const networkName = network.getName();
        const nodes: Array<RedisClusterServerNode> = [];
        const natMap: Record<string, RedisClusterServerNode> = {};
        for (const container of containers) {
            const node = {
                host: container.getHost(),
                port: container.getMappedPort(RedisClusterServer.REDIS_PORT),
            };
            nodes.push(node);
            natMap[
                `${container.getIpAddress(networkName)}:${String(RedisClusterServer.REDIS_PORT)}`
            ] = node;
        }
        return { nodes, natMap };
    }

    async init(): Promise<void> {
        const network = await new Network().start();
        const containers: Array<StartedRedisContainer> = [];
        try {
            for (
                let index = 0;
                index < RedisClusterServer.NODE_COUNT;
                index++
            ) {
                containers.push(await this.startNode(network, index));
            }
            await RedisClusterServer.createCluster(
                RedisClusterServer.createNodeHandles(network, containers),
                this.settings.startupTimeout,
            );
        } catch (error) {
            await Promise.all(
                containers.map(async (container) => await container.stop()),
            );
            await network.stop();
            throw error;
        }
        this.startedNetwork = network;
        this.startedContainers = containers;
        this.connectionSettings = RedisClusterServer.toConnectionSettings(
            network,
            containers,
        );
    }

    async deInit(): Promise<void> {
        await Promise.all(
            this.startedContainers.map(
                async (container) => await container.stop(),
            ),
        );
        await this.startedNetwork?.stop();
        this.startedContainers = [];
        this.startedNetwork = null;
        this.connectionSettings = null;
    }

    getSettings(): RedisClusterServerConnectionSettings {
        if (this.connectionSettings === null) {
            throw UnexpectedError.create(
                "RedisClusterServer.init() must be called before using the server",
            );
        }
        return this.connectionSettings;
    }
}
