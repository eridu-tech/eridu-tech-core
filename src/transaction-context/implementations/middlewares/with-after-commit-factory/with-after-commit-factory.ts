/**
 * @module TransactionContext
 */

import type { MiddlewareFn } from "@/middleware/contracts/_module.js";
import type {
    AfterCommitSettings,
    ITransactionHooks,
} from "@/transaction-context/contracts/_module.js";

/**
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
