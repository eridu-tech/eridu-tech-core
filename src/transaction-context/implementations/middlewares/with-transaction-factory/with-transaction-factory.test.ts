import { beforeEach, describe, expect, test, vi } from "vitest";

import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";
import { use } from "@/middleware/implementations/_module-exports.js";
import { TRANSACTION_PROPAGATION } from "@/transaction-context/contracts/_module-exports.js";
import { NoOpTransactionAdapter } from "@/transaction-context/implementations/adapters/no-op-transaction-adapter/_module-exports.js";
import { TransactionContextResolver } from "@/transaction-context/implementations/derivables/_module-exports.js";
import { TransactionContext } from "@/transaction-context/implementations/derivables/transaction-context/transaction-context.js";
import { withTransactionFactory } from "@/transaction-context/implementations/middlewares/with-transaction-factory/with-transaction-factory.js";

describe("function: withTransactionFactory", () => {
    const transactionContextResolver = new TransactionContextResolver<"memory">(
        {
            adapters: { memory: new NoOpTransactionAdapter<null, null>(null) },
            defaultAdapter: "memory",
            executionContext: new ExecutionContext(
                new NoOpExecutionContextAdapter(),
            ),
        },
    );

    beforeEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
    });

    test("Should run wrapped function with REQUIRED propagation by default", async () => {
        const spy = vi.spyOn(TransactionContext.prototype, "run");

        const withTransaction = withTransactionFactory(
            transactionContextResolver,
        );

        function fn(_value: string): Promise<void> {
            return Promise.resolve();
        }
        await use(fn, withTransaction())("value");

        expect(spy).toHaveBeenCalledExactlyOnceWith(
            TRANSACTION_PROPAGATION.REQUIRED,
            expect.any(Function),
        );
    });
    test("Should use the configured propagation", async () => {
        const spy = vi.spyOn(TransactionContext.prototype, "run");

        const withTransaction = withTransactionFactory(
            transactionContextResolver,
        );

        async function fn(_value: string): Promise<void> {}
        await use(
            fn,
            withTransaction({ propagation: TRANSACTION_PROPAGATION.SUPPORTS }),
        )("value");

        expect(spy).toHaveBeenCalledExactlyOnceWith(
            TRANSACTION_PROPAGATION.SUPPORTS,
            expect.any(Function),
        );
    });
    test("Should invoke the wrapped function when the transaction context runs the invocable", async () => {
        const withTransaction = withTransactionFactory(
            transactionContextResolver,
        );

        let wasInvoked = false;
        function fn(_value: string): Promise<void> {
            wasInvoked = true;
            return Promise.resolve();
        }

        await use(fn, withTransaction())("value");

        expect(wasInvoked).toBe(true);
    });
    test("Should pass through the wrapped function's arguments and return value", async () => {
        const withTransaction = withTransactionFactory(
            transactionContextResolver,
        );

        function fn(a: string, b: string): Promise<string> {
            return Promise.resolve(`${a}-${b}`);
        }

        const wrapped = use(fn, withTransaction());

        expect(await wrapped("2", "3")).toBe("2-3");
    });
    test("Should select the adapter passed to use", async () => {
        const spy = vi.spyOn(transactionContextResolver, "use");

        const withTransaction = withTransactionFactory(
            transactionContextResolver,
        );

        function fn(_value: string): Promise<void> {
            return Promise.resolve();
        }
        await use(fn, withTransaction.use("memory")())("value");

        expect(spy).toHaveBeenCalledWith("memory");
    });
});
