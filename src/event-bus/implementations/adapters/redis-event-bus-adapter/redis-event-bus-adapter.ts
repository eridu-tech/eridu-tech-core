/**
 * @module EventBus
 */

import { EventEmitter } from "eventemitter3";

import {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    SuperJsonSerde,
} from "@/serde/implementations/super-json-serde/_module-exports.js";
import { TransactionContext } from "@/transaction-context/implementations/derivables/_module-exports.js";

import type { Cluster, Redis } from "ioredis";

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
    private isDeInitialized = false;

    /**
     * A subscribed connection cannot run commands, so the listener gets its own
     * connection. `duplicate` cannot be called on the union type, so the client
     * is narrowed first.
     */
    private static duplicateClient(client: Redis | Cluster): Redis | Cluster {
        if ("nodes" in client) {
            return client.duplicate();
        }
        return client.duplicate();
    }

    constructor(settings: RedisEventBusAdapterSettings) {
        const {
            client,
            serde,
            transactionHooks = TransactionContext.noOp(null),
        } = settings;

        this.transactionHooks = transactionHooks;
        this.dispatcherClient = client;
        this.listenerClient = RedisEventBusAdapter.duplicateClient(client);
        this.serde = serde;

        this.listenerClient.on("message", this.redisListener);
    }

    private redisListener = (channel: string, message: string): void => {
        this.eventEmitter.emit(channel, this.serde.deserialize(message));
    };

    async addListener(
        eventName: string,
        listener: EventListenerFn<BaseEvent>,
    ): Promise<void> {
        if (this.eventEmitter.listenerCount(eventName) === 0) {
            await this.listenerClient.subscribe(eventName);
        }

        this.eventEmitter.on(eventName, listener);
    }

    async removeListener(
        eventName: string,
        listener: EventListenerFn<BaseEvent>,
    ): Promise<void> {
        this.eventEmitter.off(eventName, listener);

        if (this.eventEmitter.listenerCount(eventName) === 0) {
            await this.listenerClient.unsubscribe(eventName);
        }
    }

    dispatch(eventName: string, eventData: BaseEvent): Promise<void> {
        return this.transactionHooks.afterCommit(async () => {
            await this.dispatcherClient.publish(
                eventName,
                this.serde.serialize(eventData),
            );
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
            await this.listenerClient.unsubscribe();
        } finally {
            await this.listenerClient.quit();
        }
    }
}
