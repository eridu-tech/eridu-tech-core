/**
 * @module EventBus
 */

import { EventBus } from "@/event-bus/implementations/derivables/event-bus/_module.js";
import {
    DefaultAdapterNotDefinedError,
    UnregisteredAdapterError,
} from "@/utilities/_module-exports.js";

import type {
    IEventBus,
    IEventBusResolver,
    BaseEventMap,
    IEventBusAdapter,
} from "@/event-bus/contracts/_module-exports.js";
import type { EventBusSettingsBase } from "@/event-bus/implementations/derivables/event-bus/_module.js";
import type { EventMapSchema } from "@/event-bus/implementations/derivables/event-bus/with-event-bus-schema.js";

/**
 * IMPORT_PATH: `"eridu-tech/event-bus"`
 * @group Derivables
 */
export type EventBusAdapters<TAdapters extends string = string> = Partial<
    Record<TAdapters, IEventBusAdapter>
>;

/**
 * Configuration for `EventBusResolver`.
 * Registers named event-bus adapters and optionally designates a default.
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
 * The `EventBusResolver` class is immutable.
 *
 * IMPORT_PATH: `"eridu-tech/event-bus"`
 * @group Derivables
 */
export class EventBusResolver<
    TAdapters extends string = string,
    TEventMap extends BaseEventMap = BaseEventMap,
> implements IEventBusResolver<TAdapters, TEventMap> {
    constructor(
        private readonly settings: EventBusResolverSettings<
            TAdapters,
            TEventMap
        >,
    ) {}

    setEventMapType<TOutputEventMap extends BaseEventMap>(): EventBusResolver<
        TAdapters,
        TOutputEventMap
    > {
        return new EventBusResolver(
            this.settings as EventBusResolverSettings<
                TAdapters,
                TOutputEventMap
            >,
        );
    }

    setEventMapSchema<TOutputEventMap extends BaseEventMap>(
        eventMapSchema: EventMapSchema<TOutputEventMap>,
    ): EventBusResolver<TAdapters, TOutputEventMap> {
        return new EventBusResolver({
            ...this.settings,
            eventMapSchema,
        });
    }

    use(
        adapterName: TAdapters | undefined = this.settings.defaultAdapter,
    ): IEventBus<TEventMap> {
        if (adapterName === undefined) {
            throw new DefaultAdapterNotDefinedError(
                EventBusResolver.name,
                Object.keys(this.settings.adapters),
            );
        }
        const adapter = this.settings.adapters[adapterName];
        if (adapter === undefined) {
            throw new UnregisteredAdapterError(
                adapterName,
                Object.keys(this.settings.adapters),
            );
        }
        return new EventBus<TEventMap>({
            ...this.settings,
            adapter,
        });
    }
}
