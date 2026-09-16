/**
 * @module EventBus
 */

import { EventEmitter } from "node:events";

import { TransactionContext } from "@/transaction-context/implementations/derivables/_module.js";

import type {
    BaseEvent,
    EventListenerFn,
    IEventBusAdapter,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    IEventBus,
} from "@/event-bus/contracts/_module.js";
import type { ITransactionHooks } from "@/transaction-context/contracts/_module.js";

/**
 * Configuration for the `MemoryEventBusAdapter`.
 *
 * IMPORT_PATH: `"eridu-tech/event-bus/memory-event-bus"`
 * @group Adapters
 */
export type MemoryEventBusAdapterSettings = {
    /**
     * The {@link EventEmitter | `EventEmitter`} used to hold listeners and emit events.
     *
     * @default new EventEmitter()
     */
    eventEmitter?: EventEmitter;

    /**
     * The {@link ITransactionHooks | `ITransactionHooks`} that dispatches events after the
     * active transaction commits. Without it, events are dispatched immediately.
     *
     * @default TransactionContext.noOp(null)
     */
    transactionHooks?: ITransactionHooks;
};

/**
 * The `MemoryEventBusAdapter` is used for easily faking{@link IEventBus | `IEventBus`} for testing.
 *
 * IMPORT_PATH: `"eridu-tech/event-bus/memory-event-bus"`
 * @group Adapters
 */
export class MemoryEventBusAdapter implements IEventBusAdapter {
    private readonly eventEmitter: EventEmitter;
    private readonly transactionHooks: ITransactionHooks;

    /**
     *  @example
     * ```ts
     * import { MemoryEventBusAdapter } from "eridu-tech/event-bus/memory-event-bus";
     *
     * const eventBusAdapter = new MemoryEventBusAdapter();
     * ```
     * You can also provide an {@link EventEmitter | `EventEmitter`} that will be used dispatching the events in memory.
     * @example
     * ```ts
     * import { MemoryEventBusAdapter } from "eridu-tech/event-bus/memory-event-bus";
     * import { EventEmitter } from "node:events";
     *
     * const eventEmitter = new EventEmitter<any>();
     * const eventBusAdapter = new MemoryEventBusAdapter({ eventEmitter });
     * ```
     */
    constructor(settings: MemoryEventBusAdapterSettings = {}) {
        const {
            eventEmitter = new EventEmitter(),
            transactionHooks = TransactionContext.noOp(null),
        } = settings;

        this.transactionHooks = transactionHooks;
        this.eventEmitter = eventEmitter;
    }

    addListener(
        eventName: string,
        listener: EventListenerFn<BaseEvent>,
    ): Promise<void> {
        this.eventEmitter.on(eventName, listener);
        return Promise.resolve();
    }

    removeListener(
        eventName: string,
        listener: EventListenerFn<BaseEvent>,
    ): Promise<void> {
        this.eventEmitter.off(eventName, listener);
        return Promise.resolve();
    }

    dispatch(eventName: string, eventData: BaseEvent): Promise<void> {
        return this.transactionHooks.afterCommit(() => {
            this.eventEmitter.emit(eventName, eventData);
        });
    }
}
