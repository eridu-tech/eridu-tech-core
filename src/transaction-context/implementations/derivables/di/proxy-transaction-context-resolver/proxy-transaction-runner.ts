/**
 * @module TransactionContext
 */

import type {
    DiToken,
    IServiceResolver,
} from "@/di/contracts/_module-exports.js";
import type {
    ITransactionContextResolver,
    ITransactionRunner,
    TransactionPropagation,
} from "@/transaction-context/contracts/_module-exports.js";
import type { AsyncLazy } from "@/utilities/_module-exports.js";

/**
 * @internal
 */
export class ProxyTransactionRunner<
    TAdapters extends string = string,
> implements ITransactionRunner {
    constructor(
        private readonly container: Pick<IServiceResolver, "resolveOrFail">,
        private readonly resolverToken: DiToken<
            ITransactionContextResolver<TAdapters>
        >,
        private readonly adapterName: TAdapters | undefined,
    ) {}

    private async getRunner(): Promise<ITransactionRunner> {
        const transactionContextResolver = await this.container.resolveOrFail(
            this.resolverToken,
        );
        return transactionContextResolver.use(this.adapterName);
    }

    run<TValue = void>(asyncInvocable: AsyncLazy<TValue>): Promise<TValue>;
    run<TValue = void>(
        propagation: TransactionPropagation,
        asyncInvocable: AsyncLazy<TValue>,
    ): Promise<TValue>;
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    async run(propagation: any, asyncInvocable?: any): Promise<any> {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        return (await this.getRunner()).run(propagation, asyncInvocable);
    }
}
