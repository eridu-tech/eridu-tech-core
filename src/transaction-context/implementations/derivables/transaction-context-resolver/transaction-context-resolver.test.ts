import { beforeEach, describe, expect, test, vi } from "vitest";

import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";
import { NoOpTransactionAdapter } from "@/transaction-context/implementations/adapters/no-op-transaction-adapter/no-op-transaction-adapter.js";
import {
    TransactionContext,
    TransactionContextResolver,
} from "@/transaction-context/implementations/derivables/_module-exports.js";
import {
    DefaultAdapterNotDefinedError,
    UnregisteredAdapterError,
} from "@/utilities/_module-exports.js";

import type { Mock } from "vitest";

describe("class: TransactionContextResolver", () => {
    type Adapters = "adapter1" | "adapter2" | "adapter3";
    const adapter1 = new NoOpTransactionAdapter(null);
    const adapter2 = new NoOpTransactionAdapter(null);
    const resolver = new TransactionContextResolver<Adapters>({
        adapters: {
            adapter1,
            adapter2,
        },
        executionContext: new ExecutionContext(
            new AlsExecutionContextAdapter(),
        ),
        defaultAdapter: "adapter1",
    });
    let adapter1Spy: Mock<NoOpTransactionAdapter<null>["start"]>;
    let adapter2Spy: Mock<NoOpTransactionAdapter<null>["start"]>;

    beforeEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();

        adapter1Spy = vi.spyOn(adapter1, "start");
        adapter2Spy = vi.spyOn(adapter2, "start");
        resolver.init();
    });

    describe("Method: use", () => {
        test("Should throw DefaultAdapterNotDefinedError when called without arguments and no default adapter is configured", () => {
            const resolverWithoutDefaultAdapter =
                new TransactionContextResolver<Adapters>({
                    adapters: {
                        adapter1,
                        adapter2,
                    },
                    executionContext: new ExecutionContext(
                        new AlsExecutionContextAdapter(),
                    ),
                });

            expect(() => {
                resolverWithoutDefaultAdapter.use();
            }).toThrow(DefaultAdapterNotDefinedError);
        });

        test("Should throw UnregisteredAdapterError when called with an adapter name that is not registered", () => {
            expect(() => {
                resolver.use("adapter3");
            }).toThrow(UnregisteredAdapterError);
        });

        test("Should return the transaction context of the registered adapter when called with its name", () => {
            expect(resolver.use("adapter1")).toBeInstanceOf(TransactionContext);
            expect(resolver.use("adapter2")).not.toBe(resolver.use("adapter1"));
        });

        test("Should call the default adapter when called without arguments", async () => {
            await resolver.use().run(async () => {});

            expect(adapter1Spy).toHaveBeenCalledOnce();
            expect(adapter2Spy).not.toHaveBeenCalled();
        });

        test("Should call the explicitly selected adapter when called with its name", async () => {
            await resolver.use("adapter2").run(async () => {});

            expect(adapter2Spy).toHaveBeenCalledOnce();
            expect(adapter1Spy).not.toHaveBeenCalled();
        });
    });
});
