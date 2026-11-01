/**
 * @module EventBus
 */

import { withAfterHook } from "@/middleware/implementations/hooks/_module.js";
import { callInvocable } from "@/utilities/_module-exports.js";

import type {
    BaseEventMap,
    IEventBusResolver,
} from "@/event-bus/contracts/_module-exports.js";
import type { MiddlewareFn } from "@/middleware/contracts/_module-exports.js";
import type { Invocable } from "@/utilities/_module-exports.js";

/**
 * The settings object passed to the {@link WithDispatchAfterSettings.payload | `payload`}
 * invocable of the `withDispatchAfter` middleware.
 *
 * @typeParam TParameters - Tuple type of the wrapped function's parameters.
 * @typeParam TReturn - The return type of the wrapped function.
 *
 * IMPORT_PATH: `"eridu-tech/event-bus/middlewares"`
 * @group Middlewares
 */
export type WithDispatchAfterPayloadSettings<
    TParameters extends Array<unknown> = Array<unknown>,
    TReturn = unknown,
> = {
    /**
     * The arguments passed to the wrapped function.
     */
    args: TParameters;

    /**
     * The value returned by the wrapped function.
     */
    returnValue: TReturn;
};

/**
 * The settings used to configure the middleware returned by
 * {@link withDispatchAfterFactory | `withDispatchAfterFactory`}.
 *
 * @typeParam TEventMap - The event map of the event dispatcher.
 * @typeParam TEventName - The name of the event to dispatch.
 * @typeParam TParameters - Tuple type of the wrapped function's parameters.
 * @typeParam TReturn - The return type of the wrapped function.
 *
 * IMPORT_PATH: `"eridu-tech/event-bus/middlewares"`
 * @group Middlewares
 */
export type WithDispatchAfterSettings<
    TEventMap extends BaseEventMap = BaseEventMap,
    TEventName extends keyof TEventMap = keyof TEventMap,
    TParameters extends Array<unknown> = Array<unknown>,
    TReturn = unknown,
> = {
    /**
     * The name of the event to dispatch after the wrapped function resolves.
     */
    type: TEventName;

    /**
     * An invocable that produces the event payload from the wrapped function's
     * arguments and return value. It receives a
     * {@link WithDispatchAfterPayloadSettings | settings object} containing the
     * wrapped function's `args` and `returnValue`. Returning `null` skips the
     * dispatch.
     */
    payload: Invocable<
        [settings: WithDispatchAfterPayloadSettings<TParameters, TReturn>],
        TEventMap[TEventName] | null
    >;
};

/**
 * A middleware factory that dispatches an event after the wrapped function
 * resolves.
 *
 * IMPORT_PATH: `"eridu-tech/event-bus/middlewares"`
 * @group Middlewares
 */
export type WithDispatchAfter<TEventMap extends BaseEventMap = BaseEventMap> = <
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
) => MiddlewareFn<TParameters, Promise<TReturn>>;

/**
 * Resolver-facing API returned by {@link withDispatchAfterFactory}.
 *
 * IMPORT_PATH: `"eridu-tech/event-bus/middlewares"`
 * @group Middlewares
 */
export type WithDispatchAfterResolver<
    TAdapters extends string = string,
    TEventMap extends BaseEventMap = BaseEventMap,
> = {
    /**
     * Selects the adapter the returned middleware factory uses.
     *
     * @param adapter - The adapter to use. Defaults to the resolver's default
     * adapter.
     */
    use(adapter?: TAdapters): WithDispatchAfter<TEventMap>;
};

/**
 * Creates a middleware factory that dispatches an event **after** the wrapped
 * function resolves.
 *
 * When the wrapped function completes, the middleware resolves the event payload
 * from the function's arguments and return value and dispatches the configured event
 * on the selected event bus, and then returns the wrapped function's result
 * unchanged. If the payload resolves to `undefined` (or doesn't return a value), no event is dispatched and the
 * wrapped function's result is returned unchanged.
 *
 * This is useful for emitting completion events such as "user created" or for
 * recording the outcome of a function.
 *
 * @typeParam TEventMap - The event map of the event dispatcher.
 * @typeParam TAdapters - Union type of the registered adapter names.
 * @param eventBusResolver - The resolver used to select the event bus adapter.
 * @returns A {@link WithDispatchAfter} that is also a
 *          {@link WithDispatchAfterResolver}.
 *
 * IMPORT_PATH: `"eridu-tech/event-bus/middlewares"`
 * @group Middlewares
 */
export function withDispatchAfterFactory<
    TEventMap extends BaseEventMap = BaseEventMap,
    TAdapters extends string = string,
>(
    eventBusResolver: Pick<IEventBusResolver<TAdapters, TEventMap>, "use">,
): WithDispatchAfter<TEventMap> &
    WithDispatchAfterResolver<TAdapters, TEventMap> {
    const withDispatchAfterResolver: WithDispatchAfterResolver<
        TAdapters,
        TEventMap
    >["use"] = function use(adapter?: TAdapters): WithDispatchAfter<TEventMap> {
        return (settings) => {
            const { type, payload } = settings;
            return withAfterHook((args, returnValue) => {
                const event = callInvocable(payload, { args, returnValue });
                if (event !== null) {
                    void eventBusResolver.use(adapter).dispatch(type, event);
                }
            });
        };
    };

    const middleware =
        withDispatchAfterResolver() as WithDispatchAfter<TEventMap> &
            WithDispatchAfterResolver<TAdapters, TEventMap>;
    middleware.use = withDispatchAfterResolver;
    return middleware;
}
