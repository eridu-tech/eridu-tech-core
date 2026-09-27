/**
 * @module Middleware
 */

import { callInvocable } from "@/utilities/_module.js";

import type { MiddlewareFn } from "@/middleware/contracts/_module.js";
import type { Invocable } from "@/utilities/_module.js";

/**
 * Synchronous version of {@link AfterHook | `AfterHook`}.
 *
 * Receives the arguments and the result. May return a replacement result;
 * returning `void`/`undefined` keeps the original result. Must be synchronous.
 * Not called when the wrapped function throws (use {@link OnErrorHookSync | `OnErrorHookSync`} for that).
 *
 * @typeParam TParameters - Tuple type of the arguments passed to the wrapped function
 * @typeParam TReturn - Return type of the wrapped function
 *
 * @example
 * ```ts
 * const hook: AfterHookSync<[id: string], User> = ([id], user) => ({ ...user, id });
 * ```
 *
 * @see {@link withAfterHookSync | `withAfterHookSync`}
 * @see {@link AfterHook | `AfterHook`}
 *
 * IMPORT_PATH: `eridu-tech/middleware`
 * @group Implementations
 */
export type AfterHookSync<
    TParameters extends Array<unknown> = Array<unknown>,
    TReturn = unknown,
    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
> = Invocable<[args: TParameters, result: TReturn], TReturn | void>;

/**
 * Creates a synchronous middleware that runs an {@link AfterHookSync | `AfterHookSync`} after the
 * wrapped function.
 *
 * Unlike {@link withAfterHook | `withAfterHook`} the hook must be synchronous and there is no
 * `detach` option: the hook is always invoked after a successful call and can replace the result by
 * returning a value (returning nothing keeps the original result). If the wrapped function throws,
 * the hook is skipped and the error propagates.
 *
 * @typeParam TParameters - Tuple type of the arguments passed to the wrapped function
 * @typeParam TReturn - Return type of the wrapped function
 * @param callback - Synchronous hook invoked with the arguments and result after execution
 * @returns Middleware function that applies the after hook
 *
 * @example
 * ```ts
 * const createUser = use(
 *   saveUser,
 *   withAfterHookSync<[name: string], User>(([name], user) => ({
 *     ...user,
 *     name,
 *   })),
 * );
 * ```
 *
 * @see {@link AfterHookSync | `AfterHookSync`}
 * @see {@link withAfterHook | `withAfterHook`}
 *
 * IMPORT_PATH: `eridu-tech/middleware`
 * @group Implementations
 */
export function withAfterHookSync<TParameters extends Array<unknown>, TReturn>(
    callback: AfterHookSync<TParameters, NoInfer<TReturn>>,
): MiddlewareFn<TParameters, TReturn> {
    return ({ next, args }) => {
        const result = next();
        const newResult = callInvocable(callback, args, result);
        return newResult ?? result;
    };
}
