/**
 * @module TransactionContext
 */

import type {
    DiToken,
    IContainerHooks,
} from "@/di/contracts/_module-exports.js";
import type {
    AfterCommitSettings,
    ITransactionContextResolver,
    ITransactionHooks,
    ITransactionRunner,
    TransactionPropagation,
} from "@/transaction-context/contracts/_module-exports.js";
import type { AsyncLazy } from "@/utilities/_module-exports.js";

/**
 * An {@link ITransactionHooks} and {@link ITransactionRunner} that resolve the
 * underlying resolver from a dependency-injection container.
 *
 * The token is resolved once by {@link IContainer.init}, after which `use()`, `run()`,
 * and `afterCommit()` delegate to the real resolver. Construct the instance before
 * `init()`; calling any of them before `init()` is awaited throws.
 *
 * @template TAdapters - Union type of the registered adapter names.
 *
 * IMPORT_PATH: `"eridu-tech/transaction-context/di"`
 * @group Derivables
 */
export class ProxyTransactionContextResolver<TAdapters extends string = string>
    implements ITransactionHooks, ITransactionRunner
{
    private resolver:
        (ITransactionHooks & ITransactionContextResolver<TAdapters>) | null =
        null;

    constructor(
        container: Pick<IContainerHooks, "onInit">,
        resolverToken: DiToken<
            ITransactionHooks & ITransactionContextResolver<TAdapters>
        >,
    ) {
        container.onInit({ resolver: resolverToken }, (deps) => {
            this.resolver = deps.resolver;
        });
    }

    private getResolver(): ITransactionHooks &
        ITransactionContextResolver<TAdapters> {
        if (this.resolver === null) {
            throw new Error(
                "ProxyTransactionContextResolver is not ready. Await IContainer.init() before use.",
            );
        }
        return this.resolver;
    }

    use(adapterName?: TAdapters): ITransactionRunner {
        return this.getResolver().use(adapterName);
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

    afterCommit(
        asyncInvocable: AsyncLazy<void>,
        settings?: AfterCommitSettings,
    ): Promise<void> {
        return this.getResolver().afterCommit(asyncInvocable, settings);
    }
}
