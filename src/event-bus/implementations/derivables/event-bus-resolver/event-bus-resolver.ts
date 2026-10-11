/**
 * @module EventBus
 */

import { EventBus } from "@/event-bus/implementations/derivables/event-bus/_module.js";
import {
    DefaultAdapterNotDefinedError,
    UnregisteredAdapterError,
} from "@/utilities/_module-exports.js";

import type {
    IEventBusResolver,
    BaseEventMap,
    IEventBusAdapter,
    EventListener,
    IEventDispatcher,
    InferEvent,
} from "@/event-bus/contracts/_module-exports.js";
import type { EventBusSettingsBase } from "@/event-bus/implementations/derivables/event-bus/_module.js";
import type { IInitizable, OneOrArray } from "@/utilities/_module-exports.js";

/**
 * IMPORT_PATH: `"eridu-tech/event-bus"`
 * @group Derivables
 */
export type EventBusAdapters<TAdapters extends string = string> = Partial<
    Record<TAdapters, IEventBusAdapter>
>;

/**
 * Configuration for `EventBusResolver`. Provide named adapters and optionally
 * select the default adapter.
 *
 * IMPORT_PATH: `"eridu-tech/event-bus"`
 * @group Derivables
 */
export type EventBusResolverSettings<
    TAdapters extends string = string,
    TEventMap extends BaseEventMap = BaseEventMap,
> = EventBusSettingsBase<TEventMap> & {
    /**
     * Named registry of event-bus adapters. Each key is an adapter alias and the corresponding value is the adapter instance.
     */
    adapters: EventBusAdapters<TAdapters>;

    /**
     * The alias of the adapter to use when none is explicitly specified. Must be a key in the `adapters` map.
     */
    defaultAdapter?: NoInfer<TAdapters>;
};

/**
 * Creates an event bus for each registered adapter.
 * Call `init()` before registering listeners or selecting an event bus.
 *
 * IMPORT_PATH: `"eridu-tech/event-bus"`
 * @group Derivables
 */
export class EventBusResolver<
    TAdapters extends string = string,
    TEventMap extends BaseEventMap = BaseEventMap,
>
    implements IEventBusResolver<TAdapters, TEventMap>, IInitizable
{
    constructor(
        private readonly settings: EventBusResolverSettings<
            TAdapters,
            TEventMap
        >,
    ) {}

    private readonly factories = {} as Partial<
        Record<TAdapters, EventBus<TEventMap>>
    >;

    async init(): Promise<void> {
        const { adapters, ...rest } = this.settings;
        for (const adapterName in adapters) {
            const adapter = adapters[adapterName];
            if (adapter === undefined) {
                continue;
            }
            const eventBus = new EventBus({
                adapter,
                ...rest,
            });
            this.factories[adapterName] = eventBus;
        }
        return Promise.resolve();
    }

    /**
     * Registers the listener on every configured adapter.
     * Call this during setup, before the application starts.
     */
    async addListener<TEventName extends keyof TEventMap>(
        eventNames: OneOrArray<TEventName>,
        listener: EventListener<InferEvent<TEventMap, TEventName>>,
    ): Promise<void> {
        for (const adapterName in this.factories) {
            const eventBus = this.factories[adapterName];
            if (eventBus === undefined) {
                continue;
            }
            await eventBus.addListener(eventNames, listener);
        }
    }

    use(
        adapterName: TAdapters | undefined = this.settings.defaultAdapter,
    ): IEventDispatcher<TEventMap> {
        if (adapterName === undefined) {
            throw DefaultAdapterNotDefinedError.create(
                EventBus.name,
                Object.keys(this.settings.adapters),
            );
        }
        const eventBus = this.factories[adapterName];
        if (eventBus === undefined) {
            throw UnregisteredAdapterError.create(
                adapterName,
                Object.keys(this.settings.adapters),
            );
        }
        return eventBus;
    }
}
