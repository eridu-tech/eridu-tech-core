import { beforeEach, describe, expect, test, vi } from "vitest";

import { Container } from "@/di/implementations/eager/_module-exports.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";
import { NoOpTransactionAdapter } from "@/transaction-context/implementations/adapters/no-op-transaction-adapter/no-op-transaction-adapter.js";
import { TransactionContextResolver } from "@/transaction-context/implementations/derivables/_module-exports.js";
import { ProxyTransactionContextResolver } from "@/transaction-context/implementations/derivables/di/proxy-transaction-context-resolver/proxy-transaction-context-resolver.js";

import type { Mock } from "vitest";

import type { ITransactionAdapter } from "@/transaction-context/contracts/_module-exports.js";

describe("class: ProxyTransactionContextResolver", () => {
    type Adapters = "adapter1" | "adapter2";
    let transactionContext: ProxyTransactionContextResolver<Adapters>;
    let start1: Mock<ITransactionAdapter["start"]>;
    let start2: Mock<ITransactionAdapter["start"]>;

    beforeEach(async () => {
        vi.restoreAllMocks();
        vi.clearAllMocks();

        const executionContext = new ExecutionContext(
            new AlsExecutionContextAdapter(),
        );
        const container = new Container({
            executionContext,
        });

        const adapter1 = new NoOpTransactionAdapter(null);
        start1 = vi.spyOn(adapter1, "start");

        const adapter2 = new NoOpTransactionAdapter(null);
        start2 = vi.spyOn(adapter2, "start");

        const transactionContextResolver =
            new TransactionContextResolver<Adapters>({
                adapters: {
                    adapter1,
                    adapter2,
                },
                defaultAdapter: "adapter1",
                executionContext,
            });
        container.registerValue({
            token: TransactionContextResolver,
            value: transactionContextResolver,
        });
        transactionContext = new ProxyTransactionContextResolver<Adapters>(
            container,
            TransactionContextResolver,
        );

        await container.init();
    });

    test("Default adapter:", async () => {
        await transactionContext.run(async () => {});

        expect(start1).toHaveBeenCalledExactlyOnceWith();
        expect(start2).not.toHaveBeenCalled();
    });
    test("Adapter 1:", async () => {
        await transactionContext.use("adapter1").run(async () => {});

        expect(start1).toHaveBeenCalledExactlyOnceWith();
        expect(start2).not.toHaveBeenCalled();
    });
    test("Adapter 2:", async () => {
        await transactionContext.use("adapter2").run(async () => {});

        expect(start2).toHaveBeenCalledExactlyOnceWith();
        expect(start1).not.toHaveBeenCalled();
    });
});
