/**
 * @module Semaphore
 */

import { v4 } from "uuid";

import { callInvocable } from "@/utilities/_module-exports.js";

import type { MiddlewareFn } from "@/middleware/contracts/_module-exports.js";
import type { ISemaphoreFactory } from "@/semaphore/contracts/_module-exports.js";
import type { ITimeSpan } from "@/time-span/contracts/_module-exports.js";
import type { Invocable } from "@/utilities/_module-exports.js";

/**
 * Minimal resolver contract required by {@link withSemaphoreFactory}.
 *
 * A narrowed form of `ISemaphoreFactoryResolver`: `use()` only has to return a
 * factory that exposes `create`.
 *
 * @typeParam TAdapters - Union type of the registered adapter names.
 *
 * IMPORT_PATH: `"eridu-tech/semaphore/middlewares"`
 * @group Middlewares
 */
export type CreateSemaphoreResolver<TAdapters extends string = string> = {
    /**
     * Selects the semaphore factory used to create semaphores.
     *
     * @param adapterName - The adapter to use. Defaults to the resolver's
     * default adapter.
     * @returns The resolved factory, limited to `create`.
     */
    use(adapterName?: TAdapters): ISemaphoreFactory;
};

/**
 * Settings for the distributed-semaphore middleware.
 *
 * @typeParam TParameters - Tuple type of the wrapped function's parameters.
 *
 * IMPORT_PATH: `"eridu-tech/semaphore/middlewares"`
 * @group Middlewares
 */
export type WithSemaphoreSettings<
    TParameters extends Array<unknown> = Array<unknown>,
> = {
    /**
     *  A function that produces the semaphore key from the
     * wrapped function's arguments. All consumers using the same key share
     * the same semaphore limit.
     */
    key: Invocable<[args: TParameters], string>;

    /**
     *  A function that produces a unique slot identifier for
     * the current acquisition attempt. Each concurrent consumer needs a
     * distinct slot ID.
     *
     * @default
     * ```ts
     * import { v4 } from "uuid";
     *
     * () => v4()
     * ```
     */
    slotId?: Invocable<[args: TParameters], string>;

    /**
     * Time-to-live for each acquired slot. If `null` slots never expire
     * automatically. If omitted the default TTL of the semaphore factory is
     * used.
     */
    ttl?: ITimeSpan | null;

    /**
     * Maximum number of concurrent slots (consumers) allowed for the
     * semaphore key.
     */
    limit: number;
};

/**
 * A middleware factory that wraps the wrapped function in a distributed
 * semaphore.
 *
 * Produced by {@link withSemaphoreFactory}; the semaphore key comes from the
 * `key` setting.
 *
 * @typeParam TParameters - Tuple type of the wrapped function's parameters.
 * @typeParam TReturn - Return type of the wrapped function.
 *
 * IMPORT_PATH: `"eridu-tech/semaphore/middlewares"`
 * @group Middlewares
 */
export type WithSemaphore = <TParameters extends Array<unknown>, TReturn>(
    settings: WithSemaphoreSettings<TParameters>,
) => MiddlewareFn<TParameters, Promise<TReturn>>;

/**
 * Resolver-facing API returned by {@link withSemaphoreFactory}.
 *
 * Calling `use()` returns a {@link WithSemaphore} bound to the selected
 * adapter.
 *
 * @typeParam TAdapters - Union type of the registered adapter names.
 *
 * IMPORT_PATH: `"eridu-tech/semaphore/middlewares"`
 * @group Middlewares
 */
export type WithSemaphoreResolver<TAdapters extends string = string> = {
    /**
     * Selects the adapter the returned middleware factory uses.
     *
     * @param adapter - The adapter to use. Defaults to the resolver's default
     * adapter.
     * @returns A {@link WithSemaphore} bound to the selected adapter.
     */
    use(adapter?: TAdapters): WithSemaphore;
};

/**
 * Creates a middleware factory that wraps function calls with a distributed
 * semaphore.
 *
 * Before executing the wrapped function a slot is acquired on the derived
 * key. If the maximum number of concurrent slots (`limit`) has already been
 * reached the call waits (or fails immediately for non-blocking semaphores)
 * until a slot becomes available. Calling the returned function uses the
 * resolver's default adapter, while `use()` selects a specific one.
 *
 * @typeParam TAdapters - Union type of the registered adapter names.
 * @param semaphoreFactoryResolver - The resolver used to select the semaphore
 * factory.
 * @returns A {@link WithSemaphore} that is also a
 *          {@link WithSemaphoreResolver}.
 *
 * IMPORT_PATH: `"eridu-tech/semaphore/middlewares"`
 * @group Middlewares
 */
export function withSemaphoreFactory<TAdapters extends string = string>(
    semaphoreFactoryResolver: CreateSemaphoreResolver<TAdapters>,
): WithSemaphore & WithSemaphoreResolver<TAdapters> {
    const withSemaphoreResolver: WithSemaphoreResolver<TAdapters>["use"] =
        function use(adapter?: TAdapters): WithSemaphore {
            return (settings) => {
                const { key, slotId = () => v4(), ...rest } = settings;
                return ({ next, args }) => {
                    return semaphoreFactoryResolver
                        .use(adapter)
                        .create(callInvocable(key, args), {
                            ...rest,
                            slotId: callInvocable(slotId, args),
                        })
                        .runOrFail(next);
                };
            };
        };

    const middleware = withSemaphoreResolver() as WithSemaphore &
        WithSemaphoreResolver<TAdapters>;
    middleware.use = withSemaphoreResolver;
    return middleware;
}
