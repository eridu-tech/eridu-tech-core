/**
 * @module TransactionContext
 */

import type { MiddlewareFn } from "@/middleware/contracts/_module.js";
import type {
    AfterCommitSettings,
    ITransactionHooks,
} from "@/transaction-context/contracts/_module.js";

/**
 * Creates a middleware factory that runs the wrapped function once the active
 * transaction commits.
 *
 * The returned middleware delegates to `transactionContext.afterCommit()`, so `next` is
 * registered as an after-commit invocable instead of running immediately. When no
 * transaction is active, `next` runs immediately, unless
 * {@link AfterCommitSettings.runWithoutTransaction | `runWithoutTransaction`} is `false`,
 * in which case it is discarded.
 *
 * @param transactionContext - The transaction hooks whose `afterCommit()` method runs the
 * wrapped function.
 * @returns A function that accepts {@link AfterCommitSettings} and returns a middleware
 * that runs `next` after the active transaction commits.
 *
 * IMPORT_PATH: `"eridu-tech/transaction-context/middlewares"`
 * @group Middlewares
 */
export function withAfterCommitFactory(transactionContext: ITransactionHooks) {
    return <TParameters extends Array<unknown>>(
        settings: AfterCommitSettings = {},
    ): MiddlewareFn<TParameters, Promise<void>> => {
        return ({ next }) => {
            return transactionContext.afterCommit(next, settings);
        };
    };
}
