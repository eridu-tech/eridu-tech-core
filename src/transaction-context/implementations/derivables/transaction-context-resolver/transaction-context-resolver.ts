/**
 * @module TransactionContext
 */

import { genericToken } from "@/di/contracts/_module-exports.js";
import { MultiTransactionHooks } from "@/transaction-context/implementations/derivables/multi-transaction-hooks/_module.js";
import { TransactionContext } from "@/transaction-context/implementations/derivables/transaction-context/_module.js";
import {
    DefaultAdapterNotDefinedError,
    UnregisteredAdapterError,
} from "@/utilities/_module-exports.js";

import type { IExecutionContext } from "@/execution-context/contracts/_module-exports.js";
import type {
    AfterCommitSettings,
    ITransactionAdapter,
    ITransactionHooks,
    ITransactionContextResolver,
    ITransactionContextBase,
} from "@/transaction-context/contracts/_module-exports.js";
import type { AsyncLazy, IInitizable } from "@/utilities/_module-exports.js";

/**
 * IMPORT_PATH: `"eridu-tech/transaction-context"`
 * @group Derivables
 */
export type TransactionAdapters<TAdapters extends string = string> = Partial<
    Record<TAdapters, ITransactionAdapter<any>>
>;

/**
 * Configuration for `TransactionContextResolver`.
 * Registers named transaction adapters and designates a default.
 *
 * IMPORT_PATH: `"eridu-tech/transaction-context"`
 * @group Derivables
 */
export type TransactionContextResolverSettings<
    TAdapters extends string = string,
> = {
    /**
     * Named registry of transaction adapters. Each key is an adapter alias and the corresponding value is the adapter instance.
     */
    adapters: TransactionAdapters<TAdapters>;

    /**
     * The alias of the adapter to use when none is explicitly specified. Must be a key in the `adapters` map.
     */
    defaultAdapter?: NoInfer<TAdapters>;

    executionContext: IExecutionContext;
};

/**
 * The `TransactionContextResolver` class is immutable.
 *
 * IMPORT_PATH: `"eridu-tech/transaction-context"`
 * @group Derivables
 */
export class TransactionContextResolver<TAdapters extends string = string>
    implements
        ITransactionHooks,
        ITransactionContextResolver<TAdapters>,
        IInitizable
{
    private hooks?: ITransactionHooks;

    constructor(
        private readonly settings: TransactionContextResolverSettings<TAdapters>,
    ) {}

    private readonly transactionContexts = {} as Partial<
        Record<TAdapters, TransactionContext>
    >;

    async init(): Promise<void> {
        const { adapters, executionContext } = this.settings;
        for (const adapterName in adapters) {
            const adapter = adapters[adapterName];
            if (adapter === undefined) {
                continue;
            }
            const transactionContext = new TransactionContext({
                adapter,
                executionContext,
                token: genericToken<any>(adapterName),
            });
            this.transactionContexts[adapterName] = transactionContext;
        }
        const transactionContexts = Object.values(
            this.transactionContexts,
        ).filter((transactionContext) => {
            return transactionContext instanceof TransactionContext;
        });
        this.hooks = new MultiTransactionHooks(transactionContexts);
        return Promise.resolve();
    }

    use(
        adapterName: TAdapters | undefined = this.settings.defaultAdapter,
    ): ITransactionContextBase<any> {
        if (adapterName === undefined) {
            throw DefaultAdapterNotDefinedError.create(
                TransactionContext.name,
                Object.keys(this.settings.adapters),
            );
        }
        const transactionContext = this.transactionContexts[adapterName];
        if (transactionContext === undefined) {
            throw UnregisteredAdapterError.create(
                adapterName,
                Object.keys(this.settings.adapters),
            );
        }
        return transactionContext;
    }

    async afterCommit(
        asyncInvocable: AsyncLazy<void>,
        settings?: AfterCommitSettings,
    ): Promise<void> {
        await this.hooks?.afterCommit(asyncInvocable, settings);
    }
}
