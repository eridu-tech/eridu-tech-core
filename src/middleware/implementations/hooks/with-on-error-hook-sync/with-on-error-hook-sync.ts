/**
 * @module Middleware
 */

import { callInvocable } from "@/utilities/_module-exports.js";

import type { MiddlewareFn } from "@/middleware/contracts/_module-exports.js";
import type { Invocable } from "@/utilities/_module-exports.js";

/**
 * Synchronous version of {@link OnErrorHook | `OnErrorHook`}.
 *
 * Receives the arguments and the thrown error. It is for side effects only: the error is always
 * re-thrown after the hook runs. Must be synchronous.
 *
 * @typeParam TParameters - Tuple type of the arguments passed to the wrapped function
 *
 * @see {@link withOnErrorSync | `withOnErrorSync`}
 * @see {@link OnErrorHook | `OnErrorHook`}
 *
 * IMPORT_PATH: `eridu-tech/middleware`
 * @group Implementations
 */
export type OnErrorHookSync<
    TParameters extends Array<unknown> = Array<unknown>,
> = Invocable<[args: TParameters, error: unknown], void>;

/**
 * Creates a synchronous middleware that runs an {@link OnErrorHookSync | `OnErrorHookSync`} when the
 * wrapped function throws.
 *
 * Unlike {@link withOnError | `withOnError`} the hook must be synchronous and there is no `detach`
 * option: the hook is always invoked before the error is re-thrown. The error is always re-thrown
 * unchanged, and if the wrapped function succeeds the hook is not called.
 *
 * @typeParam TParameters - Tuple type of the arguments passed to the wrapped function
 * @typeParam TReturn - Return type of the wrapped function
 * @param callback - Synchronous hook invoked with the arguments and the thrown error
 * @returns Middleware function that applies the error hook
 *
 * @see {@link OnErrorHookSync | `OnErrorHookSync`}
 * @see {@link withOnError | `withOnError`}
 *
 * IMPORT_PATH: `eridu-tech/middleware`
 * @group Implementations
 */
export function withOnErrorSync<TParameters extends Array<unknown>, TReturn>(
    callback: OnErrorHookSync<TParameters>,
): MiddlewareFn<TParameters, TReturn> {
    return ({ next, args }) => {
        try {
            return next();
        } catch (error: unknown) {
            callInvocable(callback, args, error);
            throw error;
        }
    };
}
