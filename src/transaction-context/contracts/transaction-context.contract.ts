/**
 * @module TransactionContext
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { MandatoryPropagationError } from "@/transaction-context/contracts/transaction.errors.js";
import type { AsyncLazy } from "@/utilities/_module-exports.js";

/**
 * Exposes the current connection state of a transaction context: the base
 * client and the active transaction, if any.
 *
 * @typeParam TClient - The type of the base (non-transactional) client.
 * @typeParam TTransactionClient - The type of the transaction-scoped client. Defaults to `TClient`.
 *
 * IMPORT_PATH: `"eridu-tech/transaction-context/contracts"`
 * @group Contracts
 */
export type ITransactionConnection<TClient, TTransactionClient = TClient> = {
    /**
     * The base client that operates outside of any transaction.
     */
    readonly client: TClient;

    /**
     * Whether a transaction is currently active in this context.
     */
    readonly isInTransaction: boolean;

    /**
     * The active transaction-scoped client, or `null` when no transaction is active.
     */
    readonly transaction: TTransactionClient | null;

    /**
     * The client to use for the current scope: the transaction-scoped client
     * when a transaction is active, otherwise the base client.
     */
    readonly current: TClient | TTransactionClient;

    /**
     * Returns the active transaction-scoped client.
     *
     * Calling this method effectively opts the surrounding code into
     * {@link TRANSACTION_PROPAGATION.MANDATORY | `MANDATORY`} transaction propagation: it
     * assumes a transaction is already active and fails fast otherwise.
     *
     * @returns The active transaction-scoped client.
     * @throws {MandatoryPropagationError} When no transaction is currently active.
     */
    getTransactionOrFail(): TTransactionClient;
};

/**
 * Runs an invocable inside a transaction scope.
 *
 * IMPORT_PATH: `"eridu-tech/transaction-context/contracts"`
 * @group Contracts
 */
export type ITransactionRunner = {
    /**
     * Runs the invocable with {@link TRANSACTION_PROPAGATION.REQUIRED | `REQUIRED`} propagation:
     * reuses an active transaction, otherwise starts a new one.
     *
     * @returns A promise resolving with the invocable's result.
     */
    run<TValue = void>(asyncInvocable: AsyncLazy<TValue>): Promise<TValue>;

    /**
     * Runs the invocable with the given {@link TransactionPropagation} mode.
     *
     * @param propagation - How the run relates to an existing transaction.
     * @returns A promise resolving with the invocable's result.
     */
    run<TValue = void>(
        propagation: TransactionPropagation,
        asyncInvocable: AsyncLazy<TValue>,
    ): Promise<TValue>;
};

/**
 * Base transaction context contract. Extends {@link ITransactionConnection}
 * with a fail-fast accessor for the active transaction.
 *
 * @typeParam TClient - The type of the base (non-transactional) client.
 * @typeParam TTransactionClient - The type of the transaction-scoped client. Defaults to `TClient`.
 *
 * IMPORT_PATH: `"eridu-tech/transaction-context/contracts"`
 * @group Contracts
 */
export type ITransactionContextBase<
    TClient = unknown,
    TTransactionClient = TClient,
> = ITransactionConnection<TClient, TTransactionClient> & ITransactionRunner;

/**
 * Settings for {@link ITransactionHooks.afterCommit | `afterCommit()`}.
 *
 * IMPORT_PATH: `"eridu-tech/transaction-context/contracts"`
 * @group Contracts
 */
export type AfterCommitSettings = {
    /**
     * Whether to invoke the hook immediately when the context is not in a transaction,
     * instead of discarding it.
     *
     * @default true
     */
    runIfNoTransaction?: boolean;
};

/**
 * Lifecycle hooks for reacting to transaction outcomes.
 *
 * Invocables registered here run after the active transaction commits. When no transaction
 * is active, each hook decides based on its own settings whether to run immediately or to
 * be discarded.
 *
 * IMPORT_PATH: `"eridu-tech/transaction-context/contracts"`
 * @group Contracts
 */
export type ITransactionHooks = {
    /**
     * Registers an invocable to run after the active transaction is committed.
     *
     * The invocable is attached to the current transaction scope and awaited once that
     * transaction commits and `run()` resolves. When no transaction is active, the invocable
     * runs immediately unless
     * {@link AfterCommitSettings.runIfNoTransaction | `runIfNoTransaction`} is `false`,
     * in which case it is discarded.
     *
     * @param asyncInvocable - The invocable to run after the commit.
     * @param settings - Controls what happens when no transaction is active. Defaults to
     * {@link AfterCommitSettings}.
     * @returns A promise that resolves once the invocable is registered, or once it has run
     * when no transaction is active.
     */
    afterCommit(
        asyncInvocable: AsyncLazy<void>,
        settings?: AfterCommitSettings,
    ): Promise<void>;
};

/**
 * Defines how {@link ITransactionContext.run | `run()`} should behave in relation to an
 * existing transaction.
 * - `"REQUIRED"`: uses the existing transaction if available, otherwise starts a new one.
 * - `"SUPPORTS"`: uses the existing transaction if available, otherwise executes non-transactionally.
 * - `"MANDATORY"`: requires an existing transaction, throwing an error if none exists.
 * - `"NEVER"`: must execute without a transaction, throwing an error if one exists.
 *
 * IMPORT_PATH: `"eridu-tech/transaction-context/contracts"`
 * @group Contracts
 */
export const TRANSACTION_PROPAGATION = {
    /**
     * Uses the existing transaction if available, otherwise starts a new one.
     */
    REQUIRED: "REQUIRED",

    /**
     * Uses the existing transaction if available, otherwise executes non-transactionally.
     */
    SUPPORTS: "SUPPORTS",

    /**
     * Requires an existing transaction, throwing an error if none exists.
     */
    MANDATORY: "MANDATORY",

    /**
     * Must execute without a transaction, throwing an error if one exists.
     */
    NEVER: "NEVER",
} as const;

/**
 * A propagation mode from {@link TRANSACTION_PROPAGATION} that controls how
 * {@link ITransactionRunner.run | `run()`} relates to an existing transaction.
 *
 * IMPORT_PATH: `"eridu-tech/transaction-context/contracts"`
 * @group Contracts
 */
export type TransactionPropagation =
    (typeof TRANSACTION_PROPAGATION)[keyof typeof TRANSACTION_PROPAGATION];

/**
 * A full transaction context. Extends {@link ITransactionContextBase} with the
 * ability to run an invocable inside a transaction scope.
 *
 * @typeParam TClient - The type of the base (non-transactional) client.
 * @typeParam TTransactionClient - The type of the transaction-scoped client. Defaults to `TClient`.
 *
 * IMPORT_PATH: `"eridu-tech/transaction-context/contracts"`
 * @group Contracts
 */
export type ITransactionContext<
    TClient = unknown,
    TTransactionClient = TClient,
> = ITransactionContextBase<TClient, TTransactionClient> &
    ITransactionRunner &
    ITransactionHooks;

/**
 * A value that is either a plain client or an {@link ITransactionContext}.
 * Used to accept both raw clients and context-aware wrappers interchangeably.
 *
 * @typeParam TClient - The type of the base (non-transactional) client.
 * @typeParam TTransactionClient - The type of the transaction-scoped client. Defaults to `TClient`.
 *
 * IMPORT_PATH: `"eridu-tech/transaction-context/contracts"`
 * @group Contracts
 */
export type TransactionAware<TClient, TTransactionClient = TClient> =
    TClient | ITransactionContext<TClient, TTransactionClient>;

/**
 * Resolves a registered transaction adapter by name into a usable transaction context.
 *
 * @typeParam TAdapters - Union of registered adapter names.
 *
 * IMPORT_PATH: `"eridu-tech/transaction-context/contracts"`
 * @group Contracts
 */
export type ITransactionContextResolver<TAdapters extends string = string> = {
    /**
     * Returns the transaction context bound to the given adapter, falling back to the default
     * adapter when `adapterName` is omitted.
     *
     * @param adapterName - Name of the adapter to use. Defaults to the configured default adapter.
     * @returns The {@link ITransactionContextBase} bound to the resolved adapter.
     * @throws {DefaultAdapterNotDefinedError} When no name is given and no default adapter is configured.
     * @throws {UnregisteredAdapterError} When the given name is not registered.
     */
    use(adapterName?: TAdapters): ITransactionContextBase<any>;
};
