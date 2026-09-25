/**
 * @module EventBus
 */

import { withDispatchAfterFactory } from "@/event-bus/implementations/middlewares/with-dispatch-after-factory/_module.js";

import type { DiToken, IContainer } from "@/di/contracts/_module.js";
import type {
    BaseEventMap,
    IEventDispatcher,
} from "@/event-bus/contracts/_module.js";
import type { WithDispatchAfterSettings } from "@/event-bus/implementations/middlewares/with-dispatch-after-factory/_module.js";
import type { MiddlewareFn } from "@/middleware/contracts/_module.js";

/**
 * IMPORT_PATH: `"eridu-tech/event-bus/middlewares/di"`
 * @group Middlewares
 */
export function registerWithDispatchAfter<
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
        settings: WithDispatchAfterSettings<
            TEventMap,
            TEventName,
            TParameters,
            TReturn
        >,
    ): MiddlewareFn<TParameters, Promise<TReturn>> => {
        return async (args) => {
            const eventDispatcher =
                await container.resolveOrFail(eventDispatcherToken);
            const withDispatchAfter = withDispatchAfterFactory(eventDispatcher);
            const middleware = withDispatchAfter<
                TEventName,
                TParameters,
                TReturn
            >(settings);
            return middleware(args);
        };
    };
}
