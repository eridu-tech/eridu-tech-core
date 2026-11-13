import { beforeEach, describe, expect, test, vi } from "vitest";

import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";
import { use } from "@/middleware/implementations/_module-exports.js";
import { NoOpTransactionAdapter } from "@/transaction-context/implementations/adapters/no-op-transaction-adapter/no-op-transaction-adapter.js";
import { TransactionContextResolver } from "@/transaction-context/implementations/derivables/_module-exports.js";
import { TransactionContext } from "@/transaction-context/implementations/derivables/transaction-context/transaction-context.js";
import { withAfterCommitFactory } from "@/transaction-context/implementations/middlewares/with-after-commit-factory/with-after-commit-factory.js";

import type { AfterCommitSettings } from "@/transaction-context/contracts/_module-exports.js";

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
            runIfNoTransaction: false,
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
    test("Should register the hook within a transaction started through the resolver's use method", async () => {
        const executionContext = new ExecutionContext(
            new AlsExecutionContextAdapter(),
        );
        const resolver = new TransactionContextResolver<"memory">({
            adapters: { memory: new NoOpTransactionAdapter(null) },
            defaultAdapter: "memory",
            executionContext,
        });
        resolver.init();

        const withAfterCommit = withAfterCommitFactory(resolver);
        const fn = vi.fn((): Promise<void> => Promise.resolve());

        await resolver.use("memory").run(async () => {
            await use(fn, withAfterCommit())();
        });

        expect(fn).toHaveBeenCalledOnce();
    });
});
