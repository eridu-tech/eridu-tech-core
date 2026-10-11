/**
 * @module EventBus
 */

import type {
    DiToken,
    IServiceResolver,
} from "@/di/contracts/_module-exports.js";
import type {
    BaseEventMap,
    IEventBusResolver,
    IEventDispatcher,
} from "@/event-bus/contracts/_module-exports.js";

/**
 * @internal
 */
export class ProxyEventDispatcher<
    TAdapters extends string = string,
    TEventMap extends BaseEventMap = BaseEventMap,
> implements IEventDispatcher<TEventMap> {
    constructor(
        private readonly container: Pick<IServiceResolver, "resolveOrFail">,
        private readonly resolverToken: DiToken<
            IEventBusResolver<TAdapters, TEventMap>
        >,
        private readonly adapterName: TAdapters | undefined,
    ) {}

    async dispatch<TEventName extends keyof TEventMap>(
        eventName: TEventName,
        event: TEventMap[TEventName],
    ): Promise<void> {
        const eventBusResolver = await this.container.resolveOrFail(
            this.resolverToken,
        );
        await eventBusResolver.use(this.adapterName).dispatch(eventName, event);
    }
}
