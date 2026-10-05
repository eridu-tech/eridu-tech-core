/**
 * @module TransactionContext
 */

import { contextToken } from "@/execution-context/contracts/_module-exports.js";
import { MultiTransactionHooks } from "@/transaction-context/implementations/derivables/multi-transaction-hooks/_module.js";
import { TransactionContext } from "@/transaction-context/implementations/derivables/transaction-context/_module.js";
import {
    DefaultAdapterNotDefinedError,
    UnexpectedError,
    UnregisteredAdapterError,
} from "@/utilities/_module-exports.js";

import type {
    ContextToken,
    IExecutionContext,
} from "@/execution-context/contracts/_module-exports.js";
import type {
    AfterCommitSettings,
    ITransactionAdapter,
    ITransactionHooks,
    ITransactionContextResolver,
    ITransactionContextBase,
} from "@/transaction-context/contracts/_module-exports.js";
import type { ITransactionData } from "@/transaction-context/implementations/derivables/transaction-context/_module.js";
import type { AsyncLazy } from "@/utilities/_module-exports.js";

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
    implements ITransactionHooks, ITransactionContextResolver<TAdapters>
{
    private readonly hooks: ITransactionHooks;
    private readonly tokens: Partial<
        Record<string, ContextToken<ITransactionData>>
    >;

    constructor(
        private readonly settings: TransactionContextResolverSettings<TAdapters>,
    ) {
        this.hooks = new MultiTransactionHooks(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            Object.values(settings.adapters) as any,
        );
        this.tokens = Object.fromEntries(
            Object.keys(settings.adapters).map((adapterName) => [
                adapterName,
                contextToken(adapterName),
            ]),
        );
    }

    use(
        adapterName: TAdapters | undefined = this.settings.defaultAdapter,
    ): ITransactionContextBase<any> {
        if (adapterName === undefined) {
            throw new DefaultAdapterNotDefinedError(
                TransactionContextResolver.name,
                Object.keys(this.settings.adapters),
            );
        }
        const adapter = this.settings.adapters[adapterName];
        if (adapter === undefined) {
            throw new UnregisteredAdapterError(
                adapterName,
                Object.keys(this.settings.adapters),
            );
        }

        const token = this.tokens[adapterName];
        if (token === undefined) {
            throw new UnexpectedError(
                `Internal inconsistency: no context token was registered for adapter "${adapterName}". This is a bug and should be reported.`,
            );
        }

        return new TransactionContext({
            ...this.settings,
            adapter,
            token,
        });
    }

    afterCommit(
        asyncInvocable: AsyncLazy<void>,
        settings?: AfterCommitSettings,
    ): Promise<void> {
        return this.hooks.afterCommit(asyncInvocable, settings);
    }
}
