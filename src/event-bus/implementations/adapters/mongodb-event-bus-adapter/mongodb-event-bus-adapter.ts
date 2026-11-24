/**
 * @module EventBus
 */

import { EventEmitter } from "eventemitter3";
import { ObjectId } from "mongodb";

import {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    SuperJsonSerde,
} from "@/serde/implementations/super-json-serde/_module-exports.js";
import {
    resolveTransactionAware,
    TransactionContext,
} from "@/transaction-context/implementations/derivables/_module-exports.js";
import { UnexpectedError } from "@/utilities/errors.js";

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
import type {
    ITransactionConnection,
    ITransactionHooks,
    TransactionAware,
} from "@/transaction-context/contracts/_module-exports.js";
import type {
    IAsyncDeinitizable,
    IAsyncInitizable,
    InvocableFn,
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

    changeStreamSettings?: ChangeStreamOptions;

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
 * @internal
 */
class MongodbChangeStream implements IAsyncInitizable, IAsyncDeinitizable {
    private listenerFn: InvocableFn<
        [document: MongodbEventDocument],
        void
    > | null = null;
    private initPromise: Promise<void> | null = null;
    private isDeInitialized = false;

    constructor(
        private readonly changeStream: ChangeStream<MongodbEventDocument>,
    ) {}

    private static isMongodbEventDocument(
        value: unknown,
    ): value is MongodbEventDocument {
        return (
            typeof value === "object" &&
            value !== null &&
            "_id" in value &&
            value._id instanceof ObjectId &&
            "eventName" in value &&
            typeof value.eventName === "string" &&
            "eventData" in value &&
            typeof value.eventData === "string" &&
            "sendAt" in value &&
            value.sendAt instanceof Date
        );
    }

    private readonly onDocument = (change: ChangeStreamDocument): void => {
        if (change.operationType !== "insert") {
            return;
        }
        const { fullDocument } = change;
        if (!MongodbChangeStream.isMongodbEventDocument(fullDocument)) {
            return;
        }
        this.listenerFn?.(fullDocument);
    };

    private readonly onError: InvocableFn<[], void> = () => {
        // The driver closes a change stream that fails to resume. Listening to
        // the event only prevents it from being thrown as an unhandled error.
    };

    private _init(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const cleanup = (): void => {
                this.changeStream.removeListener(
                    "resumeTokenChanged",
                    onStarted,
                );
                // this.changeStream.removeListener("change", onStarted);
                this.changeStream.removeListener("error", onFailedToStart);
                this.changeStream.removeListener("close", onClosed);
            };
            const onStarted = (): void => {
                cleanup();
                resolve();
            };
            const onFailedToStart = (error: unknown): void => {
                cleanup();
                // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                reject(error);
            };
            const onClosed = (): void => {
                cleanup();
                reject(
                    UnexpectedError.create(
                        "Mongodb change stream closed before it started",
                    ),
                );
            };
            this.changeStream.once("resumeTokenChanged", onStarted);
            this.changeStream.once("change", onStarted);
            this.changeStream.once("error", onFailedToStart);
            this.changeStream.once("close", onClosed);
        });
    }

    init(): Promise<void> {
        if (this.initPromise === null) {
            this.changeStream.on("change", this.onDocument);
            this.changeStream.on("error", this.onError);
            this.initPromise = this._init();
        }
        return this.initPromise;
    }

    async deInit(): Promise<void> {
        if (this.isDeInitialized) {
            return;
        }
        this.isDeInitialized = true;

        this.changeStream.removeListener("change", this.onDocument);
        this.changeStream.removeListener("error", this.onError);
        await this.changeStream.close();
    }

    addOneListener(
        fn: InvocableFn<[document: MongodbEventDocument], void>,
    ): void {
        this.listenerFn = fn;
    }
}

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
    implements IEventBusAdapter, IAsyncDeinitizable
{
    private readonly trxCtx: Pick<
        ITransactionConnection<Db, ClientSession>,
        "client" | "transaction" | "isInTransaction"
    >;
    private readonly serde: ISerde<string>;
    private readonly collection: Collection<MongodbEventDocument>;
    private readonly eventEmitter = new EventEmitter();
    private readonly transactionHooks: ITransactionHooks;
    private readonly changeStream: MongodbChangeStream;

    constructor(settings: MongodbEventBusAdapterSettings) {
        const {
            database,
            serde,
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

        this.changeStream = new MongodbChangeStream(
            this.trxCtx.client.watch<MongodbEventDocument>(
                [
                    {
                        $match: {
                            "ns.coll": collectionName,
                        },
                    },
                ],
                changeStreamSettings,
            ),
        );

        this.changeStream.addOneListener(this.mongodbListener);
    }

    private mongodbListener: InvocableFn<
        [document: MongodbEventDocument],
        void
    > = (document) => {
        const message = this.serde.deserialize<unknown>(document.eventData);
        this.eventEmitter.emit(document.eventName, message);
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

    /**
     * Removes all internal listeners and closes the change stream.
     */
    async deInit(): Promise<void> {
        this.eventEmitter.removeAllListeners();
        await this.changeStream.deInit();
    }
}
