/**
 * @module Concurrency
 */

import type { IConcurrency } from "@/concurrency/contracts/_module-exports.js";
import type { MiddlewareFn } from "@/middleware/contracts/_module-exports.js";

/**
 * Creates a middleware that runs the wrapped function inside an abortable task.
 *
 * The task is created with `create()`, so it inherits the active `AbortSignal`
 * and can be aborted or detached like any other task.
 *
 * @typeParam TParameters - Tuple type of the wrapped function's parameters.
 * @typeParam TReturn - Return type of the wrapped function.
 * @param concurrency - The source of the task, usually an {@link IConcurrency}.
 * @returns A {@link MiddlewareFn} that invokes the wrapped function in a task.
 *
 * IMPORT_PATH: `"eridu-tech/concurrency/middlewares"`
 * @group Middlewares
 */
export function withTaskFactory<
    TParameters extends Array<unknown> = Array<unknown>,
    TReturn = unknown,
>(
    concurrency: Pick<IConcurrency, "create">,
): MiddlewareFn<TParameters, Promise<TReturn>> {
    return ({ next }) => {
        return concurrency.create(next).invoke();
    };
}
