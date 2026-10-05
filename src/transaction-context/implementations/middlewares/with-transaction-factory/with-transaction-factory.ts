/**
 * @module TransactionContext
 */

import { TRANSACTION_PROPAGATION } from "@/transaction-context/contracts/_module-exports.js";

import type { MiddlewareFn } from "@/middleware/contracts/_module-exports.js";
import type {
    ITransactionRunner,
    TransactionPropagation,
} from "@/transaction-context/contracts/_module-exports.js";

/**
 * Minimal resolver contract required by {@link withTransactionFactory}.
 *
 * A narrowed form of `ITransactionContextResolver`: `use()` only has to return a
 * runner that exposes `run`.
 *
 * @typeParam TAdapters - Union type of the registered adapter names.
 *
 * IMPORT_PATH: `"eridu-tech/transaction-context/middlewares"`
 * @group Middlewares
 */
export type RunTransactionResolver<TAdapters extends string = string> = {
    /**
     * Selects the transaction context used to run the wrapped function.
     *
     * @param adapterName - The adapter to use. Defaults to the resolver's
     * default adapter.
     * @returns The resolved context, limited to `run`.
     */
    use(adapterName?: TAdapters): ITransactionRunner;
};

/**
 * Settings for the transaction middleware.
 *
 * IMPORT_PATH: `"eridu-tech/transaction-context/middlewares"`
 * @group Middlewares
 */
export type WithTransactionSettings = {
    /**
     * How the wrapped function's transaction relates to an existing one.
     *
     * @default TRANSACTION_PROPAGATION.REQUIRED
     */
    propagation?: TransactionPropagation;
};

/**
 * A middleware factory that runs the wrapped function inside a transaction.
 *
 * Produced by {@link withTransactionFactory}; the propagation mode comes from
 * the `propagation` setting.
 *
 * @typeParam TParameters - Tuple type of the wrapped function's parameters.
 * @typeParam TReturn - Return type of the wrapped function.
 *
 * IMPORT_PATH: `"eridu-tech/transaction-context/middlewares"`
 * @group Middlewares
 */
export type WithTransaction = <TParameters extends Array<unknown>, TReturn>(
    settings?: WithTransactionSettings,
) => MiddlewareFn<TParameters, Promise<TReturn>>;

/**
 * Resolver-facing API returned by {@link withTransactionFactory}.
 *
 * Calling `use()` returns a {@link WithTransaction} bound to the selected
 * adapter.
 *
 * @typeParam TAdapters - Union type of the registered adapter names.
 *
 * IMPORT_PATH: `"eridu-tech/transaction-context/middlewares"`
 * @group Middlewares
 */
export type WithTransactionResolver<TAdapters extends string = string> = {
    /**
     * Selects the adapter the returned middleware factory uses.
     *
     * @param adapter - The adapter to use. Defaults to the resolver's default
     * adapter.
     * @returns A {@link WithTransaction} bound to the selected adapter.
     */
    use(adapter?: TAdapters): WithTransaction;
};

/**
 * Creates a middleware factory that runs the wrapped function inside a
 * transaction.
 *
 * The default propagation is `TRANSACTION_PROPAGATION.REQUIRED`: the wrapped
 * function joins an existing transaction when one is active and starts a new
 * one otherwise. Calling the returned function uses the resolver's default
 * adapter, while `use()` selects a specific one.
 *
 * @typeParam TAdapters - Union type of the registered adapter names.
 * @param transactionResolver - The resolver used to select the transaction
 * context.
 * @returns A {@link WithTransaction} that is also a
 *          {@link WithTransactionResolver}.
 *
 * IMPORT_PATH: `"eridu-tech/transaction-context/middlewares"`
 * @group Middlewares
 */
export function withTransactionFactory<TAdapters extends string = string>(
    transactionResolver: RunTransactionResolver<TAdapters>,
): WithTransaction & WithTransactionResolver<TAdapters> {
    const withTransactionResolver: WithTransactionResolver<TAdapters>["use"] =
        function use(adapter?: TAdapters): WithTransaction {
            return (settings = {}) => {
                const { propagation = TRANSACTION_PROPAGATION.REQUIRED } =
                    settings;
                return ({ next }) => {
                    return transactionResolver
                        .use(adapter)
                        .run(propagation, next);
                };
            };
        };

    const middleware = withTransactionResolver() as WithTransaction &
        WithTransactionResolver<TAdapters>;
    middleware.use = withTransactionResolver;
    return middleware;
}
