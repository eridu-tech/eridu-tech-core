/**
 * @module EventBus
 */

import { withDispatchBeforeFactory } from "@/event-bus/implementations/middlewares/with-dispatch-before-factory/_module.js";

import type { DiToken, IContainer } from "@/di/contracts/_module.js";
import type {
    BaseEventMap,
    IEventDispatcher,
} from "@/event-bus/contracts/_module.js";
import type { WithDispatchBeforeSettings } from "@/event-bus/implementations/middlewares/with-dispatch-before-factory/_module.js";
import type { MiddlewareFn } from "@/middleware/contracts/_module.js";

/**
 * IMPORT_PATH: `"eridu-tech/event-bus/middlewares/di"`
 * @group Middlewares
 */
export function registerWithDispatchBefore<
    TEventMap extends BaseEventMap = BaseEventMap,
>(
    container: IContainer,
    eventDispatcherToken: DiToken<IEventDispatcher<TEventMap>>,
) {
    return <
        TEventName extends keyof TEventMap,
        TParameters extends Array<unknown>,
        TReturn,
    >(
        settings: WithDispatchBeforeSettings<
            TEventMap,
            TEventName,
            TParameters
        >,
    ): MiddlewareFn<TParameters, Promise<TReturn>> => {
        return async (args) => {
            const eventDispatcher =
                await container.resolveOrFail(eventDispatcherToken);
            const withDispatchBefore =
                withDispatchBeforeFactory(eventDispatcher);
            const middleware = withDispatchBefore<
                TEventName,
                TParameters,
                TReturn
            >(settings);
            return middleware(args);
        };
    };
}
