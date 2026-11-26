/**
 * @module EventBus
 */

import { EventEmitter } from "eventemitter3";
import { ObjectId } from "mongodb";

import {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    SuperJsonSerde,
} from "@/serde/implementations/super-json-serde/_module-exports.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";
import {
    resolveTransactionAware,
    TransactionContext,
} from "@/transaction-context/implementations/derivables/_module-exports.js";
import { UnexpectedError } from "@/utilities/_module-exports.js";

import type {
    ChangeStream,
    ChangeStreamDocument,
    ChangeStreamOptions,
    ClientSession,
    Collection,
    CollectionOptions,
    Db,
} from "mongodb";

import type {
    BaseEvent,
    EventListenerFn,
    IEventBusAdapter,
} from "@/event-bus/contracts/_module-exports.js";
import type { ISerde } from "@/serde/contracts/_module-exports.js";
import type { ITimeSpan } from "@/time-span/contracts/_module-exports.js";
import type {
    ITransactionConnection,
    ITransactionHooks,
    TransactionAware,
} from "@/transaction-context/contracts/_module-exports.js";
import type {
    IAsyncDeinitizable,
    IAsyncInitizable,
} from "@/utilities/_module-exports.js";

/**
 * Configuration for `MongodbEventBusAdapter`.
 * Requires a MongoDB `Db` instance and a serde for serialising event payloads.
 *
 * IMPORT_PATH: `"eridu-tech/event-bus/mongodb-event-bus-adapter"`
 * @group Adapters
 */
export type MongodbEventBusAdapterSettings = {
    /**
     * The MongoDB `Db` or `TransactionContext` used to insert dispatched events and
     * to watch the collection for dispatched events.
     *
     * Pass a `TransactionContext` instance to make the adapter transaction aware. Adapters given the same instance share the same transaction.
     */
    database: TransactionAware<Db, ClientSession>;

    /**
     * Serde instance for serializing and deserializing event payloads to and from strings.
     */
    serde: ISerde<string>;

    /**
     * Name of the MongoDB collection used to store dispatched events.
     *
     * @default "eventBus"
     */
    collectionName?: string;

    /**
     * Additional options passed when creating or accessing the MongoDB collection.
     */
    collectionSettings?: CollectionOptions;

    /**
     * Options for the change stream that watches the collection for inserted
     * event documents.
     */
    changeStreamSettings?: ChangeStreamOptions;

    /**
     * How long event documents are kept before MongoDB deletes them, measured
     * from `sendAt`. Must be in seconds.
     *
     * @default TimeSpan.fromSeconds(0)
     */
    expireAfterSeconds?: ITimeSpan;

    /**
     * The {@link ITransactionHooks | `ITransactionHooks`} that dispatches events after the
     * active transaction commits. Without it, events are dispatched immediately.
     *
     * @default TransactionContext.noOp(null)
     */
    transactionHooks?: ITransactionHooks;
};

/**
 * IMPORT_PATH: `"eridu-tech/event-bus/mongodb-event-bus-adapter"`
 * @group Adapters
 */
export type MongodbEventDocument = {
    _id: ObjectId;
    eventName: string;
    eventData: string;
    sendAt: Date;
};

/**
 * The `MongodbEventBusAdapter` relies on MongoDB change streams.
 * `dispatch` inserts an event document into a collection and listeners are
 * notified through a change stream watching that collection, so every adapter
 * instance connected to the same database and collection receives the event.
 * To utilize the `MongodbEventBusAdapter`, you must install the [`"mongodb"`](https://www.npmjs.com/package/mongodb) package, run MongoDB as a replica set and supply a {@link ISerde | `ISerde`}, with a {@link SuperJsonSerde | `SuperJsonSerde`}.
 *
 * IMPORT_PATH: `"eridu-tech/event-bus/mongodb-event-bus-adapter"`
 * @group Adapters
 */
export class MongodbEventBusAdapter
    implements IEventBusAdapter, IAsyncInitizable, IAsyncDeinitizable
{
    private readonly trxCtx: Pick<
        ITransactionConnection<Db, ClientSession>,
        "client" | "transaction" | "isInTransaction"
    >;
    private readonly serde: ISerde<string>;
    private readonly collection: Collection<MongodbEventDocument>;
    private readonly eventEmitter = new EventEmitter();
    private readonly transactionHooks: ITransactionHooks;
    private readonly changeStream: ChangeStream<MongodbEventDocument>;
    private readonly expireAfterSeconds: TimeSpan;

    constructor(settings: MongodbEventBusAdapterSettings) {
        const {
            database,
            serde,
            expireAfterSeconds = TimeSpan.fromSeconds(0),
            collectionName = "eventBus",
            collectionSettings,
            changeStreamSettings,
            transactionHooks = TransactionContext.noOp(null),
        } = settings;

        this.trxCtx = resolveTransactionAware(database);
        this.transactionHooks = transactionHooks;
        this.collection = this.trxCtx.client.collection(
            collectionName,
            collectionSettings,
        );
        this.serde = serde;
        this.expireAfterSeconds = TimeSpan.fromTimeSpan(expireAfterSeconds);
        this.changeStream = this.collection.watch<MongodbEventDocument>(
            [
                {
                    $match: {
                        operationType: "insert",
                    },
                },
            ],
            changeStreamSettings,
        );
    }

    private async consume(
        first: ChangeStreamDocument<MongodbEventDocument> | null,
    ): Promise<void> {
        if (first) {
            this.mongodbListener(first);
        }

        for await (const change of this.changeStream) {
            this.mongodbListener(change);
        }
    }

    async init(): Promise<void> {
        // Should throw if the index already exists thats why the try catch is used.
        try {
            // MongoDB will remove event documents every minute once they're inserted.
            await this.collection.createIndex("sendAt", {
                expireAfterSeconds: this.expireAfterSeconds.toSeconds(),
            });
        } catch {
            /* EMPTY */
        }

        const initialDocument = await this.changeStream.tryNext();
        this.consume(initialDocument).catch(() => {});
    }

    async deInit(): Promise<void> {
        if (this.changeStream.closed) {
            return;
        }
        return this.changeStream.close();
    }

    private mongodbListener = (
        document: ChangeStreamDocument<MongodbEventDocument>,
    ): void => {
        if (document.operationType !== "insert") {
            return;
        }
        this.eventEmitter.emit(
            document.fullDocument.eventName,
            this.serde.deserialize(document.fullDocument.eventData),
        );
    };

    async addListener(
        eventName: string,
        listener: EventListenerFn<BaseEvent>,
    ): Promise<void> {
        this.eventEmitter.on(eventName, listener);
        return Promise.resolve();
    }

    async removeListener(
        eventName: string,
        listener: EventListenerFn<BaseEvent>,
    ): Promise<void> {
        this.eventEmitter.off(eventName, listener);
        return Promise.resolve();
    }

    private async _dispatch(
        eventName: string,
        eventData: BaseEvent,
    ): Promise<void> {
        const insertResult = await this.collection.insertOne(
            {
                _id: new ObjectId(),
                eventName,
                eventData: this.serde.serialize(eventData),
                sendAt: new Date(),
            },
            {
                session: this.trxCtx.transaction ?? undefined,
            },
        );
        if (!insertResult.acknowledged) {
            throw UnexpectedError.create(
                "Mongodb insertion was not acknowledged",
            );
        }
    }

    async dispatch(eventName: string, eventData: BaseEvent): Promise<void> {
        // is in mongodb transaction join instead.
        if (this.trxCtx.isInTransaction) {
            await this._dispatch(eventName, eventData);
            return;
        }
        return this.transactionHooks.afterCommit(async () => {
            await this._dispatch(eventName, eventData);
        });
    }
}
