/**
 * @module EventBus
 */

import { withOnError } from "@/middleware/implementations/hooks/_module.js";
import { callInvocable } from "@/utilities/_module-exports.js";

import type {
    BaseEventMap,
    IEventBusResolver,
} from "@/event-bus/contracts/_module-exports.js";
import type { MiddlewareFn } from "@/middleware/contracts/_module-exports.js";
import type { Invocable } from "@/utilities/_module-exports.js";

/**
 * The settings object passed to the {@link WithDispatchOnErrorSettings.payload | `payload`}
 * invocable of the `withDispatchOnError` middleware.
 *
 * @typeParam TParameters - Tuple type of the wrapped function's parameters.
 *
 * IMPORT_PATH: `"eridu-tech/event-bus/middlewares"`
 * @group Middlewares
 */
export type WithDispatchOnErrorPayloadSettings<
    TParameters extends Array<unknown> = Array<unknown>,
> = {
    /**
     * The arguments passed to the wrapped function.
     */
    args: TParameters;

    /**
     * The error thrown by the wrapped function.
     */
    error: unknown;
};

/**
 * The settings used to configure the middleware returned by
 * {@link withDispatchOnErrorFactory | `withDispatchOnErrorFactory`}.
 *
 * @typeParam TEventMap - The event map of the event dispatcher.
 * @typeParam TEventName - The name of the event to dispatch.
 * @typeParam TParameters - Tuple type of the wrapped function's parameters.
 *
 * IMPORT_PATH: `"eridu-tech/event-bus/middlewares"`
 * @group Middlewares
 */
export type WithDispatchOnErrorSettings<
    TEventMap extends BaseEventMap = BaseEventMap,
    TEventName extends keyof TEventMap = keyof TEventMap,
    TParameters extends Array<unknown> = Array<unknown>,
> = {
    /**
     * The name of the event to dispatch when the wrapped function throws.
     */
    type: TEventName;

    /**
     * An invocable that produces the event payload from the wrapped function's
     * arguments and the caught error. It receives a
     * {@link WithDispatchOnErrorPayloadSettings | settings object} containing the
     * wrapped function's `args` and `error`. Returning `null` skips the
     * dispatch.
     */
    payload: Invocable<
        [settings: WithDispatchOnErrorPayloadSettings<TParameters>],
        TEventMap[TEventName] | null
    >;
};

/**
 * A middleware factory that dispatches an event when the wrapped function
 * throws.
 *
 * IMPORT_PATH: `"eridu-tech/event-bus/middlewares"`
 * @group Middlewares
 */
export type WithDispatchOnError<TEventMap extends BaseEventMap = BaseEventMap> =
    <
        TEventName extends keyof TEventMap,
        TParameters extends Array<unknown>,
        TReturn,
    >(
        settings: WithDispatchOnErrorSettings<
            TEventMap,
            TEventName,
            TParameters
        >,
    ) => MiddlewareFn<TParameters, Promise<TReturn>>;

/**
 * Resolver-facing API returned by {@link withDispatchOnErrorFactory}.
 *
 * IMPORT_PATH: `"eridu-tech/event-bus/middlewares"`
 * @group Middlewares
 */
export type WithDispatchOnErrorResolver<
    TAdapters extends string = string,
    TEventMap extends BaseEventMap = BaseEventMap,
> = {
    /**
     * Selects the adapter the returned middleware factory uses.
     *
     * @param adapter - The adapter to use. Defaults to the resolver's default
     * adapter.
     */
    use(adapter?: TAdapters): WithDispatchOnError<TEventMap>;
};

/**
 * Creates a middleware factory that dispatches an event when the wrapped function
 * **throws**.
 *
 * When the wrapped function fails, the middleware resolves the event payload from
 * the function's arguments and the caught error, dispatches the configured event on
 * the selected event bus, and then re-throws the original error so the failure
 * still propagates to the caller. If the payload resolves to `undefined` (or doesn't return a value), no event is
 * dispatched and the original error is re-thrown as-is.
 *
 * This is useful for emitting failure events such as "user creation failed" or for
 * feeding an error-monitoring pipeline without swallowing the exception.
 *
 * @typeParam TEventMap - The event map of the event dispatcher.
 * @typeParam TAdapters - Union type of the registered adapter names.
 * @param eventBusResolver - The resolver used to select the event bus adapter.
 * @returns A {@link WithDispatchOnError} that is also a
 *          {@link WithDispatchOnErrorResolver}.
 *
 * IMPORT_PATH: `"eridu-tech/event-bus/middlewares"`
 * @group Middlewares
 */
export function withDispatchOnErrorFactory<
    TEventMap extends BaseEventMap = BaseEventMap,
    TAdapters extends string = string,
>(
    eventBusResolver: Pick<IEventBusResolver<TAdapters, TEventMap>, "use">,
): WithDispatchOnError<TEventMap> &
    WithDispatchOnErrorResolver<TAdapters, TEventMap> {
    const withDispatchOnErrorResolver: WithDispatchOnErrorResolver<
        TAdapters,
        TEventMap
    >["use"] = function use(
        adapter?: TAdapters,
    ): WithDispatchOnError<TEventMap> {
        return (settings) => {
            const { type, payload } = settings;
            return withOnError((args, error) => {
                const event = callInvocable(payload, { args, error });
                if (event !== null) {
                    void eventBusResolver.use(adapter).dispatch(type, event);
                }
            });
        };
    };

    const middleware =
        withDispatchOnErrorResolver() as WithDispatchOnError<TEventMap> &
            WithDispatchOnErrorResolver<TAdapters, TEventMap>;
    middleware.use = withDispatchOnErrorResolver;
    return middleware;
}
