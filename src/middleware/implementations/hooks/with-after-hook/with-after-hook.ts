/**
 * @module Middleware
 */

import { callInvocable } from "@/utilities/_module-exports.js";

import type { MiddlewareFn } from "@/middleware/contracts/_module-exports.js";
import type { Invocable, Promisable } from "@/utilities/_module-exports.js";

/**
 * Callback invoked after the wrapped function resolves successfully.
 *
 * Receives the arguments and the result. May return a replacement result;
 * returning `void`/`undefined` keeps the original result. May be async.
 * Not called when the wrapped function throws (use {@link OnErrorHook | `OnErrorHook`} for that).
 *
 * @typeParam TParameters - Tuple type of the arguments passed to the wrapped function
 * @typeParam TReturn - Return type of the wrapped function
 *
 * @see {@link withAfterHook | `withAfterHook`}
 * @see {@link AfterHookSync | `AfterHookSync`}
 *
 * IMPORT_PATH: `eridu-tech/middleware`
 * @group Implementations
 */
export type AfterHook<
    TParameters extends Array<unknown> = Array<unknown>,
    TReturn = unknown,
    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
> = Invocable<[args: TParameters, result: TReturn], Promisable<TReturn | void>>;

/**
 * Creates middleware that runs an {@link AfterHook | `AfterHook`} after the wrapped function.
 *
 * The hook receives the arguments and the successful result, and can replace the result by
 * returning a new value. Returning nothing keeps the original result. The hook is always awaited,
 * so it completes before the result is returned. If the wrapped function throws, the hook is
 * skipped and the error propagates.
 *
 * @typeParam TParameters - Tuple type of the arguments passed to the wrapped function
 * @typeParam TReturn - Return type of the wrapped function
 * @param callback - Hook invoked with the arguments and result after execution
 * @returns Middleware function that applies the after hook
 *
 * @see {@link AfterHook | `AfterHook`}
 * @see {@link withAfterHookSync | `withAfterHookSync`}
 *
 * IMPORT_PATH: `eridu-tech/middleware`
 * @group Implementations
 */
export function withAfterHook<TParameters extends Array<unknown>, TReturn>(
    callback: AfterHook<TParameters, NoInfer<TReturn>>,
): MiddlewareFn<TParameters, Promise<TReturn>> {
    return async ({ next, args }) => {
        const result = await next();

        const newResult = await callInvocable(callback, args, result);
        return newResult ?? result;
    };
}
