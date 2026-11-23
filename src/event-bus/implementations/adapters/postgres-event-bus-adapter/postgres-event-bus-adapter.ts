/**
 * @module EventBus
 */

import { EventEmitter } from "node:events";

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
     * The {@link ITransactionHooks | `ITransactionHooks`} that dispatches events after the
     * active transaction commits. Without it, events are dispatched immediately.
     *
     * @default TransactionContext.noOp(null)
     */
    transactionHooks?: ITransactionHooks;
};

/**
 * The `PostgresEventBusAdapter` uses PostgreSQL's `LISTEN`/`NOTIFY` mechanism to dispatch events.
 * To utilize the `PostgresEventBusAdapter`, you must install the [`"pg"`](https://www.npmjs.com/package/pg) package and supply a {@link ISerde | `ISerde`}, with a {@link SuperJsonSerde | `SuperJsonSerde`}.
 *
 * IMPORT_PATH: `"eridu-tech/event-bus/postgres-event-bus-adapter"`
 * @group Adapters
 */
export class PostgresEventBusAdapter implements IEventBusAdapter {
    private readonly serde: ISerde<string>;
    private readonly client: Client;
    private readonly eventEmitter = new EventEmitter();
    private readonly transactionHooks: ITransactionHooks;

    constructor(settings: PostgresEventBusAdapterSettings) {
        const {
            client,
            serde,
            transactionHooks = TransactionContext.noOp(null),
        } = settings;

        this.transactionHooks = transactionHooks;
        this.client = client;
        this.serde = serde;

        this.client.on("notification", this.postgresListener);
    }

    private postgresListener = (notification: Notification): void => {
        if (notification.payload === undefined) {
            throw UnexpectedError.create(
                "Received a Postgres notification without a payload.",
            );
        }
        this.eventEmitter.emit(
            notification.channel,
            this.serde.deserialize(notification.payload),
        );
    };

    async addListener(
        eventName: string,
        listener: EventListenerFn<BaseEvent>,
    ): Promise<void> {
        if (this.eventEmitter.listenerCount(eventName) === 0) {
            await this.client.query(
                `LISTEN ${this.client.escapeIdentifier(eventName)}`,
            );
        }

        this.eventEmitter.on(eventName, listener);
    }

    async removeListener(
        eventName: string,
        listener: EventListenerFn<BaseEvent>,
    ): Promise<void> {
        this.eventEmitter.off(eventName, listener);

        if (this.eventEmitter.listenerCount(eventName) === 0) {
            await this.client.query(
                `UNLISTEN ${this.client.escapeIdentifier(eventName)}`,
            );
        }
    }

    dispatch(eventName: string, eventData: BaseEvent): Promise<void> {
        return this.transactionHooks.afterCommit(async () => {
            await this.client.query("SELECT pg_notify($1, $2)", [
                eventName,
                this.serde.serialize(eventData),
            ]);
        });
    }
}
