import { beforeEach, describe, expect, test, vi } from "vitest";

import { contextToken } from "@/execution-context/contracts/_module.js";
import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import { NoOpTransactionAdapter } from "@/transaction-context/implementations/adapters/no-op-transaction-adapter/_module.js";
import { MultiTransactionHooks } from "@/transaction-context/implementations/derivables/multi-transaction-hooks/_module.js";
import { TransactionContext } from "@/transaction-context/implementations/derivables/transaction-context/_module.js";

import type { ITransactionData } from "@/transaction-context/implementations/derivables/transaction-context/_module.js";

describe("class: MultiTransactionHooks", () => {
    const adapter1 = new NoOpTransactionAdapter(null);
    const transactionContext1 = new TransactionContext({
        token: contextToken<ITransactionData<null>>("database1"),
        adapter: adapter1,
        executionContext: new ExecutionContext(
            new NoOpExecutionContextAdapter(),
        ),
    });

    const adapter2 = new NoOpTransactionAdapter(null);
    const transactionContext2 = new TransactionContext({
        token: contextToken<ITransactionData<null>>("database2"),
        adapter: adapter2,
        executionContext: new ExecutionContext(
            new NoOpExecutionContextAdapter(),
        ),
    });

    const multiTransactionHooks = new MultiTransactionHooks([
        transactionContext1,
        transactionContext2,
    ]);

    beforeEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
    });

    describe("method: afterCommit", () => {
        test("Should execute afterCommit when all transaction context are not inside transactions", async () => {
            const hook = vi.fn((): Promise<void> => Promise.resolve());
            const afterCommit1 = vi.spyOn(transactionContext1, "afterCommit");
            const afterCommit2 = vi.spyOn(transactionContext2, "afterCommit");

            await multiTransactionHooks.afterCommit(hook);

            expect(afterCommit1).not.toHaveBeenCalled();
            expect(afterCommit2).not.toHaveBeenCalled();
            expect(hook).toHaveBeenCalledOnce();
        });
        test("Should execute afterCommit only for the active context", async () => {
            const hook = vi.fn((): Promise<void> => Promise.resolve());
            vi.spyOn(
                transactionContext1,
                "isInTransaction",
                "get",
            ).mockReturnValue(true);
            const afterCommit1 = vi.spyOn(transactionContext1, "afterCommit");
            const afterCommit2 = vi.spyOn(transactionContext2, "afterCommit");

            await multiTransactionHooks.afterCommit(hook);

            expect(afterCommit1).toHaveBeenCalledOnce();
            expect(afterCommit2).toHaveBeenCalledOnce();
            expect(hook).not.toHaveBeenCalled();
        });
        test("Should always set runWithoutTransaction to false when in active transaction", async () => {
            const hook = vi.fn((): Promise<void> => Promise.resolve());
            vi.spyOn(
                transactionContext1,
                "isInTransaction",
                "get",
            ).mockReturnValue(true);
            const afterCommit1 = vi.spyOn(transactionContext1, "afterCommit");
            const afterCommit2 = vi.spyOn(transactionContext2, "afterCommit");

            await multiTransactionHooks.afterCommit(hook, {
                runWithoutTransaction: true,
            });

            expect(afterCommit1).toHaveBeenCalledExactlyOnceWith(hook, {
                runWithoutTransaction: false,
            });
            expect(afterCommit2).toHaveBeenCalledExactlyOnceWith(hook, {
                runWithoutTransaction: false,
            });
            expect(hook).not.toHaveBeenCalled();
        });
    });
});
