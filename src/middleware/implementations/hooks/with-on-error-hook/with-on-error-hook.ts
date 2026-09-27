/**
 * @module Middleware
 */

import { callInvocable } from "@/utilities/_module-exports.js";

import type { MiddlewareFn } from "@/middleware/contracts/_module-exports.js";
import type { Invocable, Promisable } from "@/utilities/_module-exports.js";

/**
 * Callback invoked when the wrapped function throws.
 *
 * Receives the arguments and the thrown error. It is for side effects only: the error is always
 * re-thrown after the hook runs. May be async.
 *
 * @typeParam TParameters - Tuple type of the arguments passed to the wrapped function
 *
 * @example
 * ```ts
 * const hook: OnErrorHook<[name: string]> = ([name], error) => {
 *   console.error(`Failed to save ${name}`, error);
 * };
 * ```
 *
 * @see {@link withOnError | `withOnError`}
 *
 * IMPORT_PATH: `eridu-tech/middleware`
 * @group Implementations
 */
export type OnErrorHook<TParameters extends Array<unknown> = Array<unknown>> =
    Invocable<[args: TParameters, error: unknown], Promisable<void>>;

/**
 * Creates middleware that runs an {@link OnErrorHook | `OnErrorHook`} when the wrapped function throws.
 *
 * The hook receives the arguments and the error, then the error is always re-thrown unchanged.
 * If the wrapped function succeeds, the hook is not called.
 *
 * @typeParam TParameters - Tuple type of the arguments passed to the wrapped function
 * @typeParam TReturn - Return type of the wrapped function
 * @param callback - Hook invoked with the arguments and the thrown error
 * @param detach - When `true`, the hook runs without being awaited. Defaults to `false`
 * @returns Middleware function that applies the error hook
 *
 * @example
 * ```ts
 * const createUser = use(
 *   saveUser,
 *   withOnError<[name: string], User>(([name], error) => {
 *     logger.error(`Failed to save ${name}`, error);
 *   }),
 * );
 * ```
 *
 * @see {@link OnErrorHook | `OnErrorHook`}
 *
 * IMPORT_PATH: `eridu-tech/middleware`
 * @group Implementations
 */
export function withOnError<TParameters extends Array<unknown>, TReturn>(
    callback: OnErrorHook<TParameters>,
    detach = false,
): MiddlewareFn<TParameters, Promise<TReturn>> {
    return async ({ next, args }) => {
        try {
            return await next();
        } catch (error: unknown) {
            if (detach) {
                void callInvocable(callback, args, error);
            } else {
                await callInvocable(callback, args, error);
            }
            throw error;
        }
    };
}
