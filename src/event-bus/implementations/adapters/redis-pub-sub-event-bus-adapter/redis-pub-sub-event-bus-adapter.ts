/**
 * @module EventBus
 */

import { EventEmitter } from "node:events";

import {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    SuperJsonSerde,
} from "@/serde/implementations/super-json-serde/_module-exports.js";
import { TransactionContext } from "@/transaction-context/implementations/derivables/_module-exports.js";

import type { Redis } from "ioredis";

import type {
    BaseEvent,
    EventListenerFn,
    IEventBusAdapter,
} from "@/event-bus/contracts/_module-exports.js";
import type { ISerde } from "@/serde/contracts/_module-exports.js";
import type { ITransactionHooks } from "@/transaction-context/contracts/_module-exports.js";

/**
 * Configuration for `RedisPubSubEventBusAdapter`.
 * Requires a Redis client and a serde for serialising event payloads.
 *
 * IMPORT_PATH: `"eridu-tech/event-bus/redis-pub-sub-event-bus-adapter"`
 * @group Adapters
 */
export type RedisPubSubEventBusAdapterSettings = {
    /**
     * The Redis client instance used for pub/sub messaging.
     */
    client: Redis;

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
 * To utilize the `RedisPubSubEventBusAdapter`, you must install the [`"ioredis"`](https://www.npmjs.com/package/ioredis) package and supply a {@link ISerde | `ISerde`}, with a {@link SuperJsonSerde | `SuperJsonSerde`}.
 *
 * IMPORT_PATH: `"eridu-tech/event-bus/redis-pub-sub-event-bus-adapter"`
 * @group Adapters
 */
export class RedisPubSubEventBusAdapter implements IEventBusAdapter {
    private readonly serde: ISerde<string>;
    private readonly dispatcherClient: Redis;
    private readonly listenerClient: Redis;
    private readonly eventEmitter = new EventEmitter();
    private readonly transactionHooks: ITransactionHooks;

    constructor(settings: RedisPubSubEventBusAdapterSettings) {
        const {
            client,
            serde,
            transactionHooks = TransactionContext.noOp(null),
        } = settings;

        this.transactionHooks = transactionHooks;
        this.dispatcherClient = client;
        this.listenerClient = client.duplicate();
        this.serde = serde;
    }

    private redisListener = async (
        channel: string,
        message: string,
    ): Promise<void> => {
        this.eventEmitter.emit(channel, await this.serde.deserialize(message));
    };

    async addListener(
        eventName: string,
        listener: EventListenerFn<BaseEvent>,
    ): Promise<void> {
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        this.eventEmitter.on(eventName, listener);

        await this.listenerClient.subscribe(eventName);

        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        this.listenerClient.on("message", this.redisListener);
    }

    async removeListener(
        eventName: string,
        listener: EventListenerFn<BaseEvent>,
    ): Promise<void> {
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        this.eventEmitter.off(eventName, listener);

        await this.listenerClient.unsubscribe(eventName);
    }

    dispatch(eventName: string, eventData: BaseEvent): Promise<void> {
        return this.transactionHooks.afterCommit(async () => {
            await this.dispatcherClient.publish(
                eventName,
                await this.serde.serialize(eventData),
            );
        });
    }
}
