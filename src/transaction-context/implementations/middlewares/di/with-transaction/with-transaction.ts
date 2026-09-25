/**
 * @module TransactionContext
 */

import { TRANSACTION_PROPAGATION } from "@/transaction-context/contracts/_module.js";
import { withTransactionFactory } from "@/transaction-context/implementations/middlewares/with-transaction-factory/_module.js";

import type { DiToken, IContainer } from "@/di/contracts/_module.js";
import type { MiddlewareFn } from "@/middleware/contracts/_module.js";
import type {
    ITransactionContext,
    TransactionPropagation,
} from "@/transaction-context/contracts/_module.js";

/**
 * IMPORT_PATH: `"eridu-tech/transaction-context/middlewares/di"`
 * @group Middlewares
 */
export function registerWithTransaction(
    container: IContainer,
    transactionContextToken: DiToken<Pick<ITransactionContext, "run">>,
) {
    return <TParameters extends Array<unknown>, TReturn>(
        propagation: TransactionPropagation = TRANSACTION_PROPAGATION.REQUIRED,
    ): MiddlewareFn<TParameters, Promise<TReturn>> => {
        return async (args) => {
            const transactionContext = await container.resolveOrFail(
                transactionContextToken,
            );
            const withTransaction = withTransactionFactory(transactionContext);
            const middleware = withTransaction<TParameters, TReturn>(
                propagation,
            );
            return middleware(args);
        };
    };
}
