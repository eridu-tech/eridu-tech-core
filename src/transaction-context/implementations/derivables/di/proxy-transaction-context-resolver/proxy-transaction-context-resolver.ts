/**
 * @module TransactionContext
 */

import { ProxyTransactionRunner } from "@/transaction-context/implementations/derivables/di/proxy-transaction-context-resolver/proxy-transaction-runner.js";

import type {
    DiToken,
    IServiceResolver,
} from "@/di/contracts/_module-exports.js";
import type {
    AfterCommitSettings,
    ITransactionContextResolver,
    ITransactionRunner,
    TransactionPropagation,
} from "@/transaction-context/contracts/_module-exports.js";
import type { AsyncLazy } from "@/utilities/_module-exports.js";

/**
 * Settings used to construct a {@link ProxyTransactionContextResolver}.
 *
 * IMPORT_PATH: `"eridu-tech/transaction-context/di"`
 * @group Derivables
 */
export type ProxyTransactionContextResolverSettings<
    TAdapters extends string = string,
> = {
    container: Pick<IServiceResolver, "resolveOrFail">;
    resolverToken: DiToken<ITransactionContextResolver<TAdapters>>;
};

/**
 * An {@link ITransactionContextResolver} and {@link ITransactionRunner} that resolve the
 * underlying resolver from a dependency-injection container.
 *
 * Construct the proxy with a {@link ProxyTransactionContextResolverSettings}.
 *
 * The `resolverToken` is resolved through the container on every operation via
 * {@link IServiceResolver.resolveOrFail}, and the operation is then delegated to the
 * resolved {@link ITransactionContextResolver}. Because resolution happens lazily, every
 * `LIFETIME` is supported:
 *
 * - `SINGLETON` and `TRANSIENT` registrations can be used once
 *   `IContainer.init()` has been awaited.
 * - `SCOPED` registrations are resolved per operation, so the proxy must be used
 *   inside `IContainer.run()`; resolving it outside of a scope throws.
 *
 * `use()` returns a lightweight {@link ITransactionRunner} that performs the same
 * per-operation resolution.
 *
 * @template TAdapters - Union type of the registered adapter names.
 *
 * IMPORT_PATH: `"eridu-tech/transaction-context/di"`
 * @group Derivables
 */
export class ProxyTransactionContextResolver<
    TAdapters extends string = string,
> implements ITransactionContextResolver<TAdapters> {
    private readonly container: Pick<IServiceResolver, "resolveOrFail">;
    private readonly resolverToken: DiToken<
        ITransactionContextResolver<TAdapters>
    >;

    constructor(settings: ProxyTransactionContextResolverSettings<TAdapters>) {
        this.container = settings.container;
        this.resolverToken = settings.resolverToken;
    }

    use(adapterName?: TAdapters): ITransactionRunner {
        return new ProxyTransactionRunner(
            this.container,
            this.resolverToken,
            adapterName,
        );
    }

    run<TValue = void>(asyncInvocable: AsyncLazy<TValue>): Promise<TValue>;
    run<TValue = void>(
        propagation: TransactionPropagation,
        asyncInvocable: AsyncLazy<TValue>,
    ): Promise<TValue>;
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    run(propagation: any, asyncInvocable?: any): Promise<any> {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        return this.use().run(propagation, asyncInvocable);
    }

    async afterCommit(
        asyncInvocable: AsyncLazy<void>,
        settings?: AfterCommitSettings,
    ): Promise<void> {
        return (
            await this.container.resolveOrFail(this.resolverToken)
        ).afterCommit(asyncInvocable, settings);
    }
}
