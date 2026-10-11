/**
 * @module EventBus
 */

import { ProxyEventDispatcher } from "@/event-bus/implementations/derivables/di/proxy-event-bus-resolver/proxy-event-dispatcher.js";

import type { DiToken, IContainer } from "@/di/contracts/_module-exports.js";
import type {
    BaseEventMap,
    EventListener,
    IEventBusResolver,
    IEventDispatcher,
    InferEvent,
} from "@/event-bus/contracts/_module-exports.js";
import type { OneOrArray } from "@/utilities/_module-exports.js";

/**
 * Settings used to construct a {@link ProxyEventBusResolver}.
 *
 * IMPORT_PATH: `"eridu-tech/event-bus/di"`
 * @group Derivables
 */
export type EventBusResolverSettings<
    TAdapters extends string = string,
    TEventMap extends BaseEventMap = BaseEventMap,
> = {
    /** Container used to resolve the registered event-bus resolver. */
    container: Pick<IContainer, "resolveOrFail" | "onInit">;

    /** Token used to resolve the `IEventBusResolver` from the container. */
    resolverToken: DiToken<IEventBusResolver<TAdapters, TEventMap>>;
};

/**
 * An {@link IEventBusResolver} that resolves the underlying resolver from a
 * dependency-injection container.
 *
 * Construct the proxy with {@link EventBusResolverSettings}. `use()` returns a
 * lightweight dispatcher that resolves the resolver through the container on
 * each operation, supporting the container's configured lifetimes. Use scoped
 * registrations inside `IContainer.run()`.
 *
 * `addListener()` registers listeners with the resolver during container
 * initialization, so call it before the application starts.
 *
 * @template TAdapters - Union type of the registered adapter names.
 * @template TEventMap - Event map used by the event bus.
 *
 * IMPORT_PATH: `"eridu-tech/event-bus/di"`
 * @group Derivables
 */
export class ProxyEventBusResolver<
    TAdapters extends string = string,
    TEventMap extends BaseEventMap = BaseEventMap,
> implements IEventBusResolver<TAdapters, TEventMap> {
    private readonly container: Pick<IContainer, "resolveOrFail" | "onInit">;
    private readonly resolverToken: DiToken<
        IEventBusResolver<TAdapters, TEventMap>
    >;

    constructor(settings: EventBusResolverSettings<TAdapters, TEventMap>) {
        this.container = settings.container;
        this.resolverToken = settings.resolverToken;
    }

    async addListener<TEventName extends keyof TEventMap>(
        eventNames: OneOrArray<TEventName>,
        listener: EventListener<InferEvent<TEventMap, TEventName>>,
    ): Promise<void> {
        this.container.onInit(
            { resolver: this.resolverToken },
            async (deps) => {
                await deps.resolver.addListener(eventNames, listener);
            },
        );
        return Promise.resolve();
    }

    use(adapterName?: TAdapters): IEventDispatcher<TEventMap> {
        return new ProxyEventDispatcher(
            this.container,
            this.resolverToken,
            adapterName,
        );
    }
}
