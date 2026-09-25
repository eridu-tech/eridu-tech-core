import { beforeEach, describe, expect, test, vi } from "vitest";

import { genericToken } from "@/di/contracts/container.contract.js";
import { CanNotResolveServiceDiError } from "@/di/contracts/container.errors.js";
import { Container } from "@/di/implementations/eager/container.js";
import { contextToken } from "@/execution-context/contracts/_module.js";
import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import { use } from "@/middleware/implementations/_module.js";
import { TRANSACTION_PROPAGATION } from "@/transaction-context/contracts/_module.js";
import { NoOpTransactionAdapter } from "@/transaction-context/implementations/adapters/no-op-transaction-adapter/_module.js";
import { TransactionContext } from "@/transaction-context/implementations/derivables/transaction-context/transaction-context.js";
import { registerWithTransaction } from "@/transaction-context/implementations/middlewares/di/with-transaction/with-transaction.js";

import type { IContainer } from "@/di/contracts/container.contract.js";
import type { ITransactionContext } from "@/transaction-context/contracts/_module.js";
import type { ITransactionData } from "@/transaction-context/implementations/derivables/transaction-context/transaction-context.js";

describe("function: registerWithTransaction", () => {
    const TRANSACTION_CONTEXT = genericToken<Pick<ITransactionContext, "run">>(
        "ITransactionContext",
    );

    let container: IContainer;
    let transactionContext: TransactionContext<null, null>;

    beforeEach(async () => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
        transactionContext = new TransactionContext<null, null>({
            token: contextToken<ITransactionData<null>>(""),
            adapter: new NoOpTransactionAdapter<null, null>(null),
            executionContext: new ExecutionContext(
                new NoOpExecutionContextAdapter(),
            ),
        });
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

    test("Should resolve the transaction context token and call run with the default propagation", async () => {
        const spy = vi.spyOn(transactionContext, "run");

        function fn(_value: string): Promise<void> {
            return Promise.resolve();
        }
        await use(
            fn,
            registerWithTransaction(container, TRANSACTION_CONTEXT)(),
        )("value");

        expect(spy).toHaveBeenCalledExactlyOnceWith(
            TRANSACTION_PROPAGATION.REQUIRED,
            expect.any(Function),
        );
    });
    test("Should use the configured propagation", async () => {
        const spy = vi.spyOn(transactionContext, "run");

        function fn(_value: string): Promise<void> {
            return Promise.resolve();
        }
        await use(
            fn,
            registerWithTransaction(
                container,
                TRANSACTION_CONTEXT,
            )(TRANSACTION_PROPAGATION.SUPPORTS),
        )("value");

        expect(spy).toHaveBeenCalledExactlyOnceWith(
            TRANSACTION_PROPAGATION.SUPPORTS,
            expect.any(Function),
        );
    });
    test("Should resolve the token on every invocation", async () => {
        const spy = vi.spyOn(container, "resolveOrFail");

        async function fn(_value: string): Promise<void> {}
        const wrapped = use(
            fn,
            registerWithTransaction(container, TRANSACTION_CONTEXT)(),
        );

        await wrapped("a");
        await wrapped("b");

        expect(spy).toHaveBeenCalledTimes(2);
    });
    test("Should pass through the wrapped function's arguments and return value", async () => {
        function fn(a: string, b: string): Promise<string> {
            return Promise.resolve(`${a}-${b}`);
        }

        const wrapped = use(
            fn,
            registerWithTransaction(container, TRANSACTION_CONTEXT)(),
        );

        expect(await wrapped("2", "3")).toBe("2-3");
    });
    test("Should reject when the token is not registered", async () => {
        const unregisteredToken = genericToken<
            Pick<ITransactionContext, "run">
        >("IUnregisteredTransactionContext");

        async function fn(_value: string): Promise<void> {}
        const wrapped = use(
            fn,
            registerWithTransaction(container, unregisteredToken)(),
        );

        await expect(wrapped("a")).rejects.toThrow(CanNotResolveServiceDiError);
    });
});
