/**
 * @module EventBus
 */

import { withBeforeHook } from "@/middleware/implementations/hooks/_module.js";
import { callInvocable } from "@/utilities/_module-exports.js";

import type {
    BaseEventMap,
    IEventBusResolver,
} from "@/event-bus/contracts/_module-exports.js";
import type { MiddlewareFn } from "@/middleware/contracts/_module-exports.js";
import type { Invocable } from "@/utilities/_module-exports.js";

/**
 * The settings object passed to the {@link WithDispatchBeforeSettings.payload | `payload`}
 * invocable of the `withDispatchBefore` middleware.
 *
 * @typeParam TParameters - Tuple type of the wrapped function's parameters.
 *
 * IMPORT_PATH: `"eridu-tech/event-bus/middlewares"`
 * @group Middlewares
 */
export type WithDispatchBeforePayloadSettings<
    TParameters extends Array<unknown> = Array<unknown>,
> = {
    /**
     * The arguments passed to the wrapped function.
     */
    args: TParameters;
};

/**
 * The settings used to configure the middleware returned by
 * {@link withDispatchBeforeFactory | `withDispatchBeforeFactory`}.
 *
 * @typeParam TEventMap - The event map of the event dispatcher.
 * @typeParam TEventName - The name of the event to dispatch.
 * @typeParam TParameters - Tuple type of the wrapped function's parameters.
 *
 * IMPORT_PATH: `"eridu-tech/event-bus/middlewares"`
 * @group Middlewares
 */
export type WithDispatchBeforeSettings<
    TEventMap extends BaseEventMap = BaseEventMap,
    TEventName extends keyof TEventMap = keyof TEventMap,
    TParameters extends Array<unknown> = Array<unknown>,
> = {
    /**
     * The name of the event to dispatch before the wrapped function is invoked.
     */
    type: TEventName;

    /**
     * An invocable that produces the event payload from the wrapped function's
     * arguments. It receives a
     * {@link WithDispatchBeforePayloadSettings | settings object} containing the
     * wrapped function's `args`. Returning `null` skips the dispatch.
     */
    payload: Invocable<
        [settings: WithDispatchBeforePayloadSettings<TParameters>],
        TEventMap[TEventName] | null
    >;
};

/**
 * A middleware factory that dispatches an event before the wrapped function.
 *
 * IMPORT_PATH: `"eridu-tech/event-bus/middlewares"`
 * @group Middlewares
 */
export type WithDispatchBefore<TEventMap extends BaseEventMap = BaseEventMap> =
    <
        TEventName extends keyof TEventMap,
        TParameters extends Array<unknown>,
        TReturn,
    >(
        settings: WithDispatchBeforeSettings<
            TEventMap,
            TEventName,
            TParameters
        >,
    ) => MiddlewareFn<TParameters, Promise<TReturn>>;

/**
 * Resolver-facing API returned by {@link withDispatchBeforeFactory}.
 *
 * IMPORT_PATH: `"eridu-tech/event-bus/middlewares"`
 * @group Middlewares
 */
export type WithDispatchBeforeResolver<
    TAdapters extends string = string,
    TEventMap extends BaseEventMap = BaseEventMap,
> = {
    /**
     * Selects the adapter the returned middleware factory uses.
     *
     * @param adapter - The adapter to use. Defaults to the resolver's default
     * adapter.
     */
    use(adapter?: TAdapters): WithDispatchBefore<TEventMap>;
};

/**
 * Creates a middleware factory that dispatches an event **before** the wrapped
 * function is invoked.
 *
 * When the wrapped function is called, the middleware resolves the event payload
 * from the function's arguments and dispatches the configured event on the selected
 * event bus, and then invokes the wrapped function and returns its result. If the
 * payload resolves to `undefined` (or doesn't return a value), no event is dispatched and the wrapped
 * function is invoked directly.
 *
 * This is useful for emitting lifecycle events such as "about to create a user"
 * or for tracing and auditing when a function starts.
 *
 * @typeParam TEventMap - The event map of the event dispatcher.
 * @typeParam TAdapters - Union type of the registered adapter names.
 * @param eventBusResolver - The resolver used to select the event bus adapter.
 * @returns A {@link WithDispatchBefore} that is also a
 *          {@link WithDispatchBeforeResolver}.
 *
 * IMPORT_PATH: `"eridu-tech/event-bus/middlewares"`
 * @group Middlewares
 */
export function withDispatchBeforeFactory<
    TEventMap extends BaseEventMap = BaseEventMap,
    TAdapters extends string = string,
>(
    eventBusResolver: Pick<IEventBusResolver<TAdapters, TEventMap>, "use">,
): WithDispatchBefore<TEventMap> &
    WithDispatchBeforeResolver<TAdapters, TEventMap> {
    const withDispatchBeforeResolver: WithDispatchBeforeResolver<
        TAdapters,
        TEventMap
    >["use"] = function use(
        adapter?: TAdapters,
    ): WithDispatchBefore<TEventMap> {
        return (settings) => {
            const { type, payload } = settings;
            return withBeforeHook((args) => {
                const event = callInvocable(payload, { args });
                if (event !== null) {
                    void eventBusResolver.use(adapter).dispatch(type, event);
                }
            });
        };
    };

    const middleware =
        withDispatchBeforeResolver() as WithDispatchBefore<TEventMap> &
            WithDispatchBeforeResolver<TAdapters, TEventMap>;
    middleware.use = withDispatchBeforeResolver;
    return middleware;
}
