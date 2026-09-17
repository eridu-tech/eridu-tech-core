/**
 * @module TransactionContext
 */

import { callInvocable } from "@/utilities/_module.js";

import type {
    AfterCommitSettings,
    ITransactionContext,
    ITransactionHooks,
} from "@/transaction-context/contracts/_module.js";
import type { AsyncLazy } from "@/utilities/_module.js";

/**
 * An {@link ITransactionHooks} that fans out `afterCommit()` hooks to several
 * {@link ITransactionContext | transaction contexts}, so a single consumer can stay
 * transaction-aware across every database a project uses, for example PostgreSQL and
 * MongoDB at the same time.
 *
 * A hook registered through `afterCommit()` is registered on every wrapped context that
 * currently has an active transaction, and therefore runs once per transaction that
 * commits. When none of the wrapped contexts is in a transaction, the hook runs
 * immediately unless
 * {@link AfterCommitSettings.runWithoutTransaction | `runWithoutTransaction`} is `false`,
 * in which case it is discarded.
 *
 * IMPORT_PATH: `"eridu-tech/transaction-context"`
 * @group Derivables
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
                runWithoutTransaction: false,
            });
        }
    }

    async afterCommit(
        asyncInvocable: AsyncLazy<void>,
        settings: AfterCommitSettings = {},
    ): Promise<void> {
        const { runWithoutTransaction = true } = settings;
        if (!this.isInTransaction && runWithoutTransaction) {
            await callInvocable(asyncInvocable);
            return;
        }
        await this._afterCommit(asyncInvocable);
    }
}
