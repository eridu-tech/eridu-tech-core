/**
 * @module Middleware
 */

import { callInvocable } from "@/utilities/_module.js";

import type { MiddlewareFn } from "@/middleware/contracts/_module.js";
import type { Invocable } from "@/utilities/_module.js";

/**
 * Synchronous version of {@link BeforeHook | `BeforeHook`}.
 *
 * Receives the original argument tuple and may return a new tuple to replace it.
 * Returning `void`/`undefined` keeps the original arguments. Must be synchronous.
 *
 * @typeParam TParameters - Tuple type of the arguments passed to the wrapped function
 *
 * @example
 * ```ts
 * const hook: BeforeHookSync<[name: string]> = ([name]) => [name.trim()];
 * ```
 *
 * @see {@link withBeforeHookSync | `withBeforeHookSync`}
 * @see {@link BeforeHook | `BeforeHook`}
 *
 * IMPORT_PATH: `eridu-tech/middleware`
 * @group Implementations
 */
export type BeforeHookSync<
    TParameters extends Array<unknown> = Array<unknown>,
> =
    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
    Invocable<[args: TParameters], TParameters | void>;

/**
 * Creates a synchronous middleware that runs a {@link BeforeHookSync | `BeforeHookSync`} before
 * the wrapped function.
 *
 * Unlike {@link withBeforeHook | `withBeforeHook`} the hook must be synchronous and there is no
 * `detach` option: the hook is always invoked before the wrapped function and the wrapped function
 * receives the returned arguments (or the original ones when the hook returns nothing).
 *
 * @typeParam TParameters - Tuple type of the arguments passed to the wrapped function
 * @typeParam TReturn - Return type of the wrapped function
 * @param callback - Synchronous hook invoked with the arguments before execution
 * @returns Middleware function that applies the before hook
 *
 * @example
 * ```ts
 * const createUser = use(
 *   saveUser,
 *   withBeforeHookSync<[name: string], User>(([name]) => [name.trim()]),
 * );
 * ```
 *
 * @see {@link BeforeHookSync | `BeforeHookSync`}
 * @see {@link withBeforeHook | `withBeforeHook`}
 *
 * IMPORT_PATH: `eridu-tech/middleware`
 * @group Implementations
 */
export function withBeforeHookSync<TParameters extends Array<unknown>, TReturn>(
    callback: BeforeHookSync<NoInfer<TParameters>>,
): MiddlewareFn<TParameters, TReturn> {
    return ({ next, args }) => {
        const newArgs = callInvocable(callback, args);
        return next(newArgs ?? args);
    };
}
