/**
 * @module TransactionContext
 */

import { withAfterCommitFactory } from "@/transaction-context/implementations/middlewares/with-after-commit-factory/_module.js";

import type { DiToken, IContainer } from "@/di/contracts/_module.js";
import type { MiddlewareFn } from "@/middleware/contracts/_module.js";
import type {
    AfterCommitSettings,
    ITransactionHooks,
} from "@/transaction-context/contracts/_module.js";

/**
 * IMPORT_PATH: `"eridu-tech/transaction-context/middlewares/di"`
 * @group Middlewares
 */
export function registerWithAfterCommit(
    container: IContainer,
    transactionContextToken: DiToken<ITransactionHooks>,
) {
    return <TParameters extends Array<unknown>>(
        settings: AfterCommitSettings = {},
    ): MiddlewareFn<TParameters, Promise<void>> => {
        return async (args) => {
            const transactionContext = await container.resolveOrFail(
                transactionContextToken,
            );
            const withAfterCommit = withAfterCommitFactory(transactionContext);
            const middleware = withAfterCommit<TParameters>(settings);
            return middleware(args);
        };
    };
}
