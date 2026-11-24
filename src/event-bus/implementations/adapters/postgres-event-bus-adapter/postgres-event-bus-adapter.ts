/**
 * @module EventBus
 */

import { EventEmitter } from "eventemitter3";

import {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    SuperJsonSerde,
} from "@/serde/implementations/super-json-serde/_module-exports.js";
import { TransactionContext } from "@/transaction-context/implementations/derivables/_module-exports.js";
import { UnexpectedError } from "@/utilities/errors.js";

import type { Client, Notification } from "pg";

import type {
    BaseEvent,
    EventListenerFn,
    IEventBusAdapter,
} from "@/event-bus/contracts/_module-exports.js";
import type { ISerde } from "@/serde/contracts/_module-exports.js";
import type { ITransactionHooks } from "@/transaction-context/contracts/_module-exports.js";
import type { IAsyncDeinitizable } from "@/utilities/_module-exports.js";

/**
 * Configuration for `PostgresEventBusAdapter`.
 * Requires a Postgres client and a serde for serialising event payloads.
 *
 * IMPORT_PATH: `"eridu-tech/event-bus/postgres-event-bus-adapter"`
 * @group Adapters
 */
export type PostgresEventBusAdapterSettings = {
    /**
     * The Postgres client instance used for `LISTEN`/`NOTIFY` messaging.
     */
    client: Client;

    /**
     * Serde instance for serializing and deserializing event payloads to and from strings.
     */
    serde: ISerde<string>;

    /**
     * The PostgreSQL channel name used for `LISTEN`/`NOTIFY` messaging.
     * Must be a non-empty PostgreSQL identifier of at most 63 bytes.
     *
     * @default "eridu_tech_event_bus"
     */
    channelName?: string;

    /**
     * The {@link ITransactionHooks | `ITransactionHooks`} that dispatches events after the
     * active transaction commits. Without it, events are dispatched immediately.
     *
     * @default TransactionContext.noOp(null)
     */
    transactionHooks?: ITransactionHooks;
};

/**
 * @internal
 */
type PostgresEventBusMessage = {
    eventName: string;
    eventData: BaseEvent;
};

/**
 * The `PostgresEventBusAdapter` uses a single PostgreSQL `LISTEN`/`NOTIFY` channel to dispatch events.
 * The channel is only listened to while the adapter has at least one listener, and every notification carries the event name alongside the event payload.
 * To utilize the `PostgresEventBusAdapter`, you must install the [`"pg"`](https://www.npmjs.com/package/pg) package and supply a {@link ISerde | `ISerde`}, with a {@link SuperJsonSerde | `SuperJsonSerde`}.
 *
 * IMPORT_PATH: `"eridu-tech/event-bus/postgres-event-bus-adapter"`
 * @group Adapters
 */
export class PostgresEventBusAdapter
    implements IEventBusAdapter, IAsyncDeinitizable
{
    private readonly serde: ISerde<string>;
    private readonly client: Client;
    private readonly eventEmitter = new EventEmitter();
    private readonly transactionHooks: ITransactionHooks;
    private static readonly DEFAULT_CHANNEL_NAME = "eridu_tech_event_bus";
    private readonly channelName: string;
    private isDeInitialized = false;

    private static isPostgresEventBusMessage(
        value: unknown,
    ): value is PostgresEventBusMessage {
        if (typeof value !== "object" || value === null) {
            return false;
        }
        const { eventName, eventData } = value as {
            eventName?: unknown;
            eventData?: unknown;
        };
        return (
            typeof eventName === "string" &&
            typeof eventData === "object" &&
            eventData !== null
        );
    }

    constructor(settings: PostgresEventBusAdapterSettings) {
        const {
            client,
            serde,
            channelName = PostgresEventBusAdapter.DEFAULT_CHANNEL_NAME,
            transactionHooks = TransactionContext.noOp(null),
        } = settings;

        this.transactionHooks = transactionHooks;
        this.channelName = channelName;
        this.client = client;
        this.serde = serde;

        this.client.on("notification", this.postgresListener);
    }

    private totalListenerCount(): number {
        let count = 0;
        for (const eventName of this.eventEmitter.eventNames()) {
            count += this.eventEmitter.listenerCount(eventName);
        }
        return count;
    }

    private postgresListener = (notification: Notification): void => {
        if (notification.channel !== this.channelName) {
            return;
        }
        if (notification.payload === undefined) {
            throw UnexpectedError.create("!!__MESSAGE__!!");
        }
        const message = this.serde.deserialize<unknown>(notification.payload);
        if (!PostgresEventBusAdapter.isPostgresEventBusMessage(message)) {
            throw UnexpectedError.create("!!__MESSAGE__!!");
        }
        this.eventEmitter.emit(message.eventName, message.eventData);
    };

    async addListener(
        eventName: string,
        listener: EventListenerFn<BaseEvent>,
    ): Promise<void> {
        if (this.totalListenerCount() === 0) {
            await this.client.query(
                `LISTEN ${this.client.escapeIdentifier(this.channelName)}`,
            );
        }

        this.eventEmitter.on(eventName, listener);
    }

    async removeListener(
        eventName: string,
        listener: EventListenerFn<BaseEvent>,
    ): Promise<void> {
        this.eventEmitter.off(eventName, listener);

        if (this.totalListenerCount() === 0) {
            await this.client.query(
                `UNLISTEN ${this.client.escapeIdentifier(this.channelName)}`,
            );
        }
    }

    dispatch(eventName: string, eventData: BaseEvent): Promise<void> {
        return this.transactionHooks.afterCommit(async () => {
            await this.client.query("SELECT pg_notify($1, $2)", [
                this.channelName,
                this.serde.serialize({
                    eventName,
                    eventData,
                }),
            ]);
        });
    }

    /**
     * Removes all internal listeners, detaches the notification handler and
     * stops listening on the configured channel.
     */
    async deInit(): Promise<void> {
        if (this.isDeInitialized) {
            return;
        }
        this.isDeInitialized = true;

        const isListening = this.totalListenerCount() > 0;
        this.eventEmitter.removeAllListeners();
        this.client.removeListener("notification", this.postgresListener);
        if (isListening) {
            await this.client.query(
                `UNLISTEN ${this.client.escapeIdentifier(this.channelName)}`,
            );
        }
    }
}
