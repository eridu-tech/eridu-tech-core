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
 * Creates a middleware that resolves its {@link ITransactionHooks} from a
 * dependency-injection container and runs the wrapped function after the active
 * transaction commits.
 *
 * The token is resolved on every invocation of the wrapped function, so a token
 * that is overridden or scoped after the middleware was built still takes
 * effect. Everything else matches {@link withAfterCommitFactory}.
 *
 * @param container - The container the transaction context is resolved from.
 * @param transactionContextToken - The token the transaction context is
 *        registered under.
 * @returns A function that accepts {@link AfterCommitSettings} and returns a
 *          middleware.
 * @throws {@link CanNotResolveServiceDiError} When the token is not registered.
 *
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
