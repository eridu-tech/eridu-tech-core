/**
 * @module TransactionContext
 */

import { callInvocable } from "@/utilities/_module-exports.js";

import type {
    AfterCommitSettings,
    ITransactionContext,
    ITransactionHooks,
} from "@/transaction-context/contracts/_module-exports.js";
import type { AsyncLazy } from "@/utilities/_module-exports.js";

/**
 * @internal
 */
export class MultiTransactionHooks implements ITransactionHooks {
    constructor(
        private readonly transactionContexts: Array<ITransactionContext>,
    ) {}

    private get isInTransaction(): boolean {
        return this.transactionContexts.some(
            (trxCtx) => trxCtx.isInTransaction,
        );
    }

    private async _afterCommit(asyncInvocable: AsyncLazy<void>): Promise<void> {
        for (const transactionContext of this.transactionContexts) {
            await transactionContext.afterCommit(asyncInvocable, {
                runIfNoTransaction: false,
            });
        }
    }

    async afterCommit(
        asyncInvocable: AsyncLazy<void>,
        settings: AfterCommitSettings = {},
    ): Promise<void> {
        const { runIfNoTransaction = true } = settings;
        if (!this.isInTransaction && runIfNoTransaction) {
            await callInvocable(asyncInvocable);
            return;
        }
        await this._afterCommit(asyncInvocable);
    }
}
