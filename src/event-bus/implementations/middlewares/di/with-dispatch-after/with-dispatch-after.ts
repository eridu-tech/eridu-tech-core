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
 * Creates a middleware that resolves its {@link IEventDispatcher} from a
 * dependency-injection container and dispatches the configured event **after**
 * the wrapped function resolves.
 *
 * The token is resolved on every invocation of the wrapped function, so a token
 * that is overridden or scoped after the middleware was built still takes
 * effect. Everything else matches {@link withDispatchAfterFactory}.
 *
 * @typeParam TEventMap - The event map of the event dispatcher.
 * @param container - The container the event dispatcher is resolved from.
 * @param eventDispatcherToken - The token the event dispatcher is registered
 *        under.
 * @returns A function that accepts {@link WithDispatchAfterSettings} and returns
 *          a middleware.
 * @throws {@link CanNotResolveServiceDiError} When the token is not registered.
 *
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
