/**
 * @module EventBus
 */

import { EventEmitter } from "eventemitter3";
import { Cluster, Redis } from "ioredis";

import {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    SuperJsonSerde,
} from "@/serde/implementations/super-json-serde/_module-exports.js";
import { TransactionContext } from "@/transaction-context/implementations/derivables/_module-exports.js";
import { containsRedisClusterHashTag } from "@/utilities/_module-exports.js";

import type {
    BaseEvent,
    EventListenerFn,
    IEventBusAdapter,
} from "@/event-bus/contracts/_module-exports.js";
import type { ISerde } from "@/serde/contracts/_module-exports.js";
import type { ITransactionHooks } from "@/transaction-context/contracts/_module-exports.js";
import type { IAsyncDeinitizable } from "@/utilities/_module-exports.js";

/**
 * Configuration for `RedisEventBusAdapter`.
 * Requires a Redis client and a serde for serialising event payloads.
 *
 * IMPORT_PATH: `"eridu-tech/event-bus/redis-event-bus-adapter"`
 * @group Adapters
 */
export type RedisEventBusAdapterSettings = {
    /**
     * The Redis client instance used for pub/sub messaging.
     * Both a standalone `Redis` client and an ioredis `Cluster` client are supported.
     */
    client: Redis | Cluster;

    /**
     * Serde instance for serializing and deserializing event payloads to and from strings.
     */
    serde: ISerde<string>;

    /**
     * Wraps the key in a Redis hash tag, e.g. `lock` becomes `{lock}`, so keys
     * with the same name land in the same hash slot across clusters. Set it to
     * `false` to use the key as is, e.g. when it already contains a hash tag.
     *
     * @default true
     */
    useShardingKey?: boolean;

    /**
     * The {@link ITransactionHooks | `ITransactionHooks`} that dispatches events after the
     * active transaction commits. Without it, events are dispatched immediately.
     *
     * @default TransactionContext.noOp(null)
     */
    transactionHooks?: ITransactionHooks;
};

/**
 * To utilize the `RedisEventBusAdapter`, you must install the [`"ioredis"`](https://www.npmjs.com/package/ioredis) package and supply a {@link ISerde | `ISerde`}, with a {@link SuperJsonSerde | `SuperJsonSerde`}.
 *
 * IMPORT_PATH: `"eridu-tech/event-bus/redis-event-bus-adapter"`
 * @group Adapters
 */
export class RedisEventBusAdapter
    implements IEventBusAdapter, IAsyncDeinitizable
{
    private readonly serde: ISerde<string>;
    private readonly dispatcherClient: Redis | Cluster;
    private readonly listenerClient: Redis | Cluster;
    private readonly eventEmitter = new EventEmitter();
    private readonly transactionHooks: ITransactionHooks;
    private readonly useShardingKey: boolean;
    private isDeInitialized = false;

    private static duplicateClient(client: Redis | Cluster): Redis | Cluster {
        if (client instanceof Cluster) {
            return client.duplicate();
        }
        return client.duplicate();
    }

    private registerListener(client: Redis | Cluster): void {
        if (client instanceof Cluster) {
            this.listenerClient.on("smessage", this.redisListener);
        }
        this.listenerClient.on("message", this.redisListener);
    }

    constructor(settings: RedisEventBusAdapterSettings) {
        const {
            client,
            serde,
            useShardingKey = true,
            transactionHooks = TransactionContext.noOp(null),
        } = settings;

        this.useShardingKey = useShardingKey;
        this.transactionHooks = transactionHooks;
        this.dispatcherClient = client;
        this.listenerClient = RedisEventBusAdapter.duplicateClient(client);
        this.serde = serde;

        this.registerListener(client);
    }

    private redisListener = (channel: string, message: string): void => {
        this.eventEmitter.emit(channel, this.serde.deserialize(message));
    };

    private async redisSubscribe(eventName: string): Promise<void> {
        if (this.listenerClient instanceof Redis) {
            await this.listenerClient.subscribe(eventName);
            return;
        }
        if (containsRedisClusterHashTag(eventName)) {
            await this.listenerClient.ssubscribe(eventName);
            return;
        }
        await this.listenerClient.subscribe(eventName);
    }

    private shardingKey(key: string): string {
        if (this.useShardingKey && !containsRedisClusterHashTag(key)) {
            return `{${key}}`;
        }
        return key;
    }

    async addListener(
        eventName: string,
        listener: EventListenerFn<BaseEvent>,
    ): Promise<void> {
        eventName = this.shardingKey(eventName);
        if (this.eventEmitter.listenerCount(eventName) === 0) {
            await this.redisSubscribe(eventName);
        }

        this.eventEmitter.on(eventName, listener);
    }

    private async redisUnsubscribe(eventName?: string): Promise<void> {
        if (eventName === undefined) {
            if (this.listenerClient instanceof Redis) {
                await this.listenerClient.unsubscribe();
                return;
            }
            await this.listenerClient.sunsubscribe();
            return;
        }
        if (this.listenerClient instanceof Redis) {
            await this.listenerClient.unsubscribe(eventName);
            return;
        }
        if (containsRedisClusterHashTag(eventName)) {
            await this.listenerClient.sunsubscribe(eventName);
            return;
        }
        await this.listenerClient.unsubscribe(eventName);
    }

    async removeListener(
        eventName: string,
        listener: EventListenerFn<BaseEvent>,
    ): Promise<void> {
        eventName = this.shardingKey(eventName);
        this.eventEmitter.off(eventName, listener);

        if (this.eventEmitter.listenerCount(eventName) === 0) {
            await this.redisUnsubscribe(eventName);
        }
    }

    private async redisPublish(
        eventName: string,
        message: string,
    ): Promise<void> {
        if (this.dispatcherClient instanceof Redis) {
            await this.dispatcherClient.publish(eventName, message);
            return;
        }
        if (containsRedisClusterHashTag(eventName)) {
            await this.dispatcherClient.spublish(eventName, message);
            return;
        }
        await this.dispatcherClient.publish(eventName, message);
    }

    dispatch(eventName: string, eventData: BaseEvent): Promise<void> {
        eventName = this.shardingKey(eventName);
        return this.transactionHooks.afterCommit(async () => {
            await this.redisPublish(eventName, this.serde.serialize(eventData));
        });
    }

    /**
     * Removes all internal listeners, unsubscribes from every Redis channel and
     * closes the dedicated listener connection.
     */
    async deInit(): Promise<void> {
        if (this.isDeInitialized) {
            return;
        }
        this.isDeInitialized = true;

        this.listenerClient.removeListener("message", this.redisListener);
        this.eventEmitter.removeAllListeners();
        try {
            await this.redisUnsubscribe();
        } finally {
            await this.listenerClient.quit();
        }
    }
}
