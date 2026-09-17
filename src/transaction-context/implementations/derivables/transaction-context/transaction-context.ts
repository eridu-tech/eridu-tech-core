/**
 * @module TransactionContext
 */

import { contextToken } from "@/execution-context/contracts/_module.js";
import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import {
    withAfterHook,
    withOnError,
    withPlugin,
} from "@/middleware/implementations/_module.js";
import {
    AbortTransactionError,
    CommitTransactionError,
    MandatoryPropagationError,
    NeverPropagationError,
    StartTransactionError,
    TRANSACTION_PROPAGATION,
} from "@/transaction-context/contracts/_module.js";
import { NoOpTransactionAdapter } from "@/transaction-context/implementations/adapters/no-op-transaction-adapter/_module.js";
import { callInvocable, UnexpectedError } from "@/utilities/_module.js";

import type {
    ContextToken,
    IExecutionContext,
} from "@/execution-context/contracts/_module.js";
import type { PluginFn } from "@/middleware/contracts/_module.js";
import type {
    AfterCommitSettings,
    ITransaction,
    ITransactionAdapter,
    ITransactionContext,
    TransactionPropagation,
} from "@/transaction-context/contracts/_module.js";
import type { AsyncLazy, InvocableFn } from "@/utilities/_module.js";

/**
 * Configuration for the `TransactionContext` derivable.
 *
 * @typeParam TClient - The type of the base (non-transactional) client.
 * @typeParam TTransactionClient - The type of the transaction-scoped client.
 *
 * IMPORT_PATH: `"eridu-tech/transaction-context"`
 * @group Derivables
 */
export type ITransactionContextSettings<
    TClient = unknown,
    TTransactionClient = TClient,
> = {
    /**
     * The context token under which the active transaction-scoped client is
     * stored in the execution context.
     */
    token: ContextToken<ITransactionData<TTransactionClient>>;

    /**
     * The adapter used to start transactions for the underlying client.
     */
    adapter: ITransactionAdapter<TClient, TTransactionClient>;

    /**
     * The execution context used to track the active transaction across scopes.
     */
    executionContext: IExecutionContext;
};

/**
 * @internal
 */
export type ITransactionData<TTransactionClient = unknown> = {
    client: TTransactionClient;
    afterCommit: Array<AsyncLazy<void>>;
};

/**
 * A derivable {@link ITransactionContext} that runs invocables inside transaction scopes.
 *
 * When `run()` is invoked while no transaction is active, a new transaction is started
 * through the configured {@link ITransactionContextSettings.adapter | adapter}, its
 * transaction-scoped client is stored in the execution context under the configured
 * token, and the transaction is committed after the invocable succeeds. Nested `run()`
 * calls reuse the already active transaction instead of starting a new one.
 *
 * @typeParam TClient - The type of the base (non-transactional) client.
 * @typeParam TTransactionClient - The type of the transaction-scoped client.
 *
 * IMPORT_PATH: `"eridu-tech/transaction-context"`
 * @group Derivables
 */
export class TransactionContext<
    TClient = unknown,
    TTransactionClient = TClient,
> implements ITransactionContext<TClient, TTransactionClient> {
    private readonly token: ContextToken<ITransactionData<TTransactionClient>>;
    private readonly adapter: ITransactionAdapter<TClient, TTransactionClient>;
    private readonly executionContext: IExecutionContext;

    /**
     * Creates an {@link ITransactionContext} that never uses transactions.
     *
     * Backed by {@link NoOpTransactionAdapter | `NoOpTransactionAdapter`} and
     * {@link NoOpExecutionContextAdapter | `NoOpExecutionContextAdapter`}, so:
     * - `run()` invokes its invocable directly.
     * - `isInTransaction` is always `false`, `transaction` is always `null` and `current`
     *   is always the base client.
     * - `getTransactionOrFail()` always throws
     *   {@link MandatoryPropagationError | `MandatoryPropagationError`}.
     * - `afterCommit()` invocables run immediately; when `runIfNoTransaction` is `false`
     *   they never run, because there is no transaction that can commit.
     *
     * Useful when transactions are not needed or not supported.
     *
     * @typeParam TClient_ - The type of the base (non-transactional) client.
     * @typeParam TTransactionClient_ - The type of the transaction-scoped client. Defaults to `TClient_`.
     * @param client - The base client exposed by the created context.
     * @returns A non-transactional {@link ITransactionContext} wrapping `client`.
     *
     * @example
     * ```ts
     * const transactionContext = TransactionContext.noOp(client);
     *
     * // Runs directly, without a transaction:
     * await transactionContext.run(() => createUser("1"));
     * ```
     *
     * @see {@link TransactionContext | `TransactionContext`}
     */
    static noOp<TClient_, TTransactionClient_ = TClient_>(
        client: TClient_,
    ): ITransactionContext<TClient_, TTransactionClient_> {
        return new TransactionContext({
            token: contextToken(""),
            adapter: new NoOpTransactionAdapter(client),
            executionContext: new ExecutionContext(
                new NoOpExecutionContextAdapter(),
            ),
        });
    }

    private static enhanceTransaction<TClient_>(
        getAfterCommitHooks: InvocableFn<[], Array<AsyncLazy<void>>>,
    ): PluginFn<ITransaction<TClient_>> {
        return (adapter, enhance) => {
            enhance(adapter, "abort", [
                withOnError((_, error) => {
                    throw AbortTransactionError.create(error);
                }),
            ]);
            enhance(adapter, "commit", [
                withOnError((_, error) => {
                    throw CommitTransactionError.create(error);
                }),
                withAfterHook(async () => {
                    for (const afterCommitHook of [...getAfterCommitHooks()]) {
                        await callInvocable(afterCommitHook);
                    }
                }),
            ]);
        };
    }

    private static enhanceTransactionAdapter<
        TClient_,
        TTransactionClient_ = TClient_,
    >(
        getAfterCommitHooks: InvocableFn<[], Array<AsyncLazy<void>>>,
    ): PluginFn<ITransactionAdapter<TClient_, TTransactionClient_>> {
        return (adapter, enhance) => {
            enhance(adapter, "start", [
                withOnError((_, error) => {
                    throw StartTransactionError.create(error);
                }),
                async ({ next }) => {
                    const result = await next();
                    if (result === null) {
                        return null;
                    }
                    return withPlugin(
                        result,
                        TransactionContext.enhanceTransaction(
                            getAfterCommitHooks,
                        ),
                    );
                },
            ]);
        };
    }

    constructor(
        settings: ITransactionContextSettings<TClient, TTransactionClient>,
    ) {
        const { token, adapter, executionContext } = settings;
        this.token = token;
        this.adapter = withPlugin(
            adapter,
            TransactionContext.enhanceTransactionAdapter(() => {
                const transactionData = this.executionContext.get(this.token);
                return transactionData?.afterCommit ?? [];
            }),
        );
        this.executionContext = executionContext;
    }

    get client(): TClient {
        return this.adapter.client;
    }

    get isInTransaction(): boolean {
        return this.transaction !== null;
    }

    get transaction(): TTransactionClient | null {
        return this.executionContext.get(this.token)?.client ?? null;
    }

    get current(): TClient | TTransactionClient {
        const trx = this.transaction;
        if (trx === null) {
            return this.client;
        }
        return trx;
    }

    getTransactionOrFail(): TTransactionClient {
        const trx = this.transaction;
        if (trx === null) {
            throw MandatoryPropagationError.create();
        }
        return trx;
    }

    async afterCommit(
        asyncInvocable: AsyncLazy<void>,
        settings: AfterCommitSettings = {},
    ): Promise<void> {
        const { runIfNoTransaction = true } = settings;
        const transactionData = this.executionContext.get(this.token);
        if (transactionData === null && runIfNoTransaction) {
            await callInvocable(asyncInvocable);
        }
        if (transactionData === null) {
            return;
        }
        transactionData.afterCommit.push(asyncInvocable);
    }

    private runWithRequiredPropagation<TValue = void>(
        asyncInvocable: AsyncLazy<TValue>,
    ): Promise<TValue> {
        return this.executionContext.run(async () => {
            if (this.isInTransaction) {
                return await callInvocable(asyncInvocable);
            }
            const trx = await this.adapter.start();
            if (trx === null) {
                return await callInvocable(asyncInvocable);
            }

            try {
                this.executionContext.add(this.token, {
                    client: trx.client,
                    afterCommit: [],
                });
                const result = await callInvocable(asyncInvocable);

                await trx.commit();

                return result;
            } catch (error: unknown) {
                if (error instanceof CommitTransactionError) {
                    throw error;
                }

                await trx.abort();

                throw error;
            }
        });
    }

    private async runWithSupportsPropagation<TValue = void>(
        asyncInvocable: AsyncLazy<TValue>,
    ): Promise<TValue> {
        return callInvocable(asyncInvocable);
    }

    private runWithMandatoryPropagation<TValue = void>(
        asyncInvocable: AsyncLazy<TValue>,
    ): Promise<TValue> {
        return this.executionContext.run(async () => {
            this.getTransactionOrFail();
            return callInvocable(asyncInvocable);
        });
    }

    private runWithNeverPropagation<TValue = void>(
        asyncInvocable: AsyncLazy<TValue>,
    ): Promise<TValue> {
        return this.executionContext.run(async () => {
            if (this.isInTransaction) {
                throw NeverPropagationError.create();
            }
            return callInvocable(asyncInvocable);
        });
    }
    private internalRun<TValue = void>(
        propagation: TransactionPropagation,
        asyncInvocable: AsyncLazy<TValue>,
    ): Promise<TValue> {
        if (propagation === TRANSACTION_PROPAGATION.MANDATORY) {
            return this.runWithMandatoryPropagation(asyncInvocable);
        } else if (propagation === TRANSACTION_PROPAGATION.NEVER) {
            return this.runWithNeverPropagation(asyncInvocable);
        } else if (propagation === TRANSACTION_PROPAGATION.REQUIRED) {
            return this.runWithRequiredPropagation(asyncInvocable);
        }
        return this.runWithSupportsPropagation(asyncInvocable);
    }

    run<TValue = void>(asyncInvocable: AsyncLazy<TValue>): Promise<TValue>;
    run<TValue = void>(
        propagation: TransactionPropagation,
        asyncInvocable: AsyncLazy<TValue>,
    ): Promise<TValue>;
    run<TValue = void>(
        propagation: TransactionPropagation | AsyncLazy<TValue>,
        asyncInvocable?: AsyncLazy<TValue>,
    ): Promise<TValue> {
        if (typeof propagation === "string" && asyncInvocable !== undefined) {
            return this.internalRun(propagation, asyncInvocable);
        } else if (typeof propagation !== "string") {
            return this.internalRun(
                TRANSACTION_PROPAGATION.REQUIRED,
                propagation,
            );
        }
        throw new UnexpectedError(
            "run() was called with a propagation mode but no asyncInvocable",
        );
    }
}
