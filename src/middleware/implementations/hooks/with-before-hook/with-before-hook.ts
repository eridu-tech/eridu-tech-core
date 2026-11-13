/**
 * @module Middleware
 */

import { callInvocable } from "@/utilities/_module-exports.js";

import type { MiddlewareFn } from "@/middleware/contracts/_module-exports.js";
import type { Invocable, Promisable } from "@/utilities/_module-exports.js";

/**
 * Callback invoked before the wrapped function executes.
 *
 * Receives the original argument tuple and may return a new tuple to replace it.
 * Returning `void`/`undefined` keeps the original arguments. May be async.
 *
 * @typeParam TParameters - Tuple type of the arguments passed to the wrapped function
 *
 * @see {@link withBeforeHook | `withBeforeHook`}
 * @see {@link BeforeHookSync | `BeforeHookSync`}
 *
 * IMPORT_PATH: `eridu-tech/middleware`
 * @group Implementations
 */
export type BeforeHook<TParameters extends Array<unknown> = Array<unknown>> =
    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
    Invocable<[args: TParameters], Promisable<TParameters | void>>;

/**
 * Creates middleware that runs a {@link BeforeHook | `BeforeHook`} before the wrapped function.
 *
 * The hook receives the arguments before execution and can replace them by returning a new tuple.
 * Returning nothing keeps the original arguments. The hook is always awaited before the wrapped
 * function is invoked.
 *
 * @typeParam TParameters - Tuple type of the arguments passed to the wrapped function
 * @typeParam TReturn - Return type of the wrapped function
 * @param callback - Hook invoked with the arguments before execution
 * @returns Middleware function that applies the before hook
 *
 * @see {@link BeforeHook | `BeforeHook`}
 * @see {@link withBeforeHookSync | `withBeforeHookSync`}
 *
 * IMPORT_PATH: `eridu-tech/middleware`
 * @group Implementations
 */
export function withBeforeHook<TParameters extends Array<unknown>, TReturn>(
    callback: BeforeHook<NoInfer<TParameters>>,
): MiddlewareFn<TParameters, Promise<TReturn>> {
    return async ({ next, args }) => {
        const newArgs = await callInvocable(callback, args);
        return next(newArgs ?? args);
    };
}
