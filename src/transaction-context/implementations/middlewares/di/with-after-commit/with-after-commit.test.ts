import { beforeEach, describe, expect, test, vi } from "vitest";

import { genericToken } from "@/di/contracts/container.contract.js";
import { CanNotResolveServiceDiError } from "@/di/contracts/container.errors.js";
import { Container } from "@/di/implementations/eager/container.js";
import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import { use } from "@/middleware/implementations/_module.js";
import { TransactionContext } from "@/transaction-context/implementations/derivables/transaction-context/transaction-context.js";
import { registerWithAfterCommit } from "@/transaction-context/implementations/middlewares/di/with-after-commit/with-after-commit.js";

import type { IContainer } from "@/di/contracts/container.contract.js";
import type {
    AfterCommitSettings,
    ITransactionContext,
    ITransactionHooks,
} from "@/transaction-context/contracts/_module.js";

describe("function: registerWithAfterCommit", () => {
    const TRANSACTION_CONTEXT =
        genericToken<ITransactionHooks>("ITransactionHooks");

    let container: IContainer;
    let transactionContext: ITransactionContext<null, null>;

    beforeEach(async () => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
        transactionContext = TransactionContext.noOp(null);
        container = new Container({
            executionContext: new ExecutionContext(
                new NoOpExecutionContextAdapter(),
            ),
        });
        container.registerValue({
            token: TRANSACTION_CONTEXT,
            value: transactionContext,
        });
        await container.init();
    });

    test("Should resolve the transaction context token and call afterCommit with the default settings", async () => {
        const spy = vi.spyOn(transactionContext, "afterCommit");

        function fn(): Promise<void> {
            return Promise.resolve();
        }
        await use(
            fn,
            registerWithAfterCommit(container, TRANSACTION_CONTEXT)(),
        )();

        expect(spy).toHaveBeenCalledExactlyOnceWith(expect.any(Function), {});
    });
    test("Should pass the configured settings to the afterCommit method", async () => {
        const spy = vi.spyOn(transactionContext, "afterCommit");

        function fn(): Promise<void> {
            return Promise.resolve();
        }
        const settings = {
            runIfNoTransaction: false,
        } satisfies AfterCommitSettings;
        await use(
            fn,
            registerWithAfterCommit(container, TRANSACTION_CONTEXT)(settings),
        )();

        expect(spy).toHaveBeenCalledExactlyOnceWith(
            expect.any(Function),
            settings,
        );
    });
    test("Should resolve the token on every invocation", async () => {
        const spy = vi.spyOn(container, "resolveOrFail");

        async function fn(): Promise<void> {}
        const wrapped = use(
            fn,
            registerWithAfterCommit(container, TRANSACTION_CONTEXT)(),
        );

        await wrapped();
        await wrapped();

        expect(spy).toHaveBeenCalledTimes(2);
    });
    test("Should reject when the token is not registered", async () => {
        const unregisteredToken = genericToken<ITransactionHooks>(
            "IUnregisteredTransactionHooks",
        );

        async function fn(): Promise<void> {}
        const wrapped = use(
            fn,
            registerWithAfterCommit(container, unregisteredToken)(),
        );

        await expect(wrapped()).rejects.toThrow(CanNotResolveServiceDiError);
    });
});
