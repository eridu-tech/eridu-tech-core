/**
 * @module EventBus
 */

import { withDispatchOnErrorFactory } from "@/event-bus/implementations/middlewares/with-dispatch-on-error-factory/_module.js";

import type { DiToken, IContainer } from "@/di/contracts/_module.js";
import type {
    BaseEventMap,
    IEventDispatcher,
} from "@/event-bus/contracts/_module.js";
import type { WithDispatchOnErrorSettings } from "@/event-bus/implementations/middlewares/with-dispatch-on-error-factory/_module.js";
import type { MiddlewareFn } from "@/middleware/contracts/_module.js";

/**
 * IMPORT_PATH: `"eridu-tech/event-bus/middlewares/di"`
 * @group Middlewares
 */
export function registerWithDispatchOnError<
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
        settings: WithDispatchOnErrorSettings<
            TEventMap,
            TEventName,
            TParameters
        >,
    ): MiddlewareFn<TParameters, Promise<TReturn>> => {
        return async (args) => {
            const eventDispatcher =
                await container.resolveOrFail(eventDispatcherToken);
            const withDispatchOnError =
                withDispatchOnErrorFactory(eventDispatcher);
            const middleware = withDispatchOnError<
                TEventName,
                TParameters,
                TReturn
            >(settings);
            return middleware(args);
        };
    };
}
