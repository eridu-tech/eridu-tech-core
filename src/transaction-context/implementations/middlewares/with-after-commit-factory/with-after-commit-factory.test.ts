import { beforeEach, describe, expect, test, vi } from "vitest";

import { use } from "@/middleware/implementations/_module.js";
import { TransactionContext } from "@/transaction-context/implementations/derivables/transaction-context/transaction-context.js";
import { withAfterCommitFactory } from "@/transaction-context/implementations/middlewares/with-after-commit-factory/with-after-commit-factory.js";

import type { AfterCommitSettings } from "@/transaction-context/contracts/_module.js";

describe("function: withAfterCommitFactory", () => {
    const transactionContext = TransactionContext.noOp(null);

    beforeEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
    });

    test("Should call the afterCommit method of the transaction context", async () => {
        const spy = vi.spyOn(transactionContext, "afterCommit");

        const withAfterCommit = withAfterCommitFactory(transactionContext);

        function fn(): Promise<void> {
            return Promise.resolve();
        }
        await use(fn, withAfterCommit())();

        expect(spy).toHaveBeenCalledOnce();
    });
    test("Should pass the default settings to the afterCommit method", async () => {
        const spy = vi.spyOn(transactionContext, "afterCommit");

        const withAfterCommit = withAfterCommitFactory(transactionContext);

        function fn(): Promise<void> {
            return Promise.resolve();
        }
        await use(fn, withAfterCommit())();

        expect(spy).toHaveBeenCalledExactlyOnceWith(expect.any(Function), {});
    });
    test("Should pass the configured settings to the afterCommit method", async () => {
        const spy = vi.spyOn(transactionContext, "afterCommit");

        const withAfterCommit = withAfterCommitFactory(transactionContext);
        const settings = {
            runWithoutTransaction: false,
        } satisfies AfterCommitSettings;

        function fn(): Promise<void> {
            return Promise.resolve();
        }
        await use(fn, withAfterCommit(settings))();

        expect(spy).toHaveBeenCalledExactlyOnceWith(
            expect.any(Function),
            settings,
        );
    });
});
