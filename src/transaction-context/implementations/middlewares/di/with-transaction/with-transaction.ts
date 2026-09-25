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
 * Creates a middleware that resolves its {@link ITransactionContext} from a
 * dependency-injection container and runs the wrapped function inside a
 * transaction.
 *
 * The token is resolved on every invocation of the wrapped function, so a token
 * that is overridden or scoped after the middleware was built still takes
 * effect. Everything else matches {@link withTransactionFactory}.
 *
 * @param container - The container the transaction context is resolved from.
 * @param transactionContextToken - The token the transaction context is
 *        registered under.
 * @returns A function that accepts a {@link TransactionPropagation} and returns
 *          a middleware.
 * @throws {@link CanNotResolveServiceDiError} When the token is not registered.
 *
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
