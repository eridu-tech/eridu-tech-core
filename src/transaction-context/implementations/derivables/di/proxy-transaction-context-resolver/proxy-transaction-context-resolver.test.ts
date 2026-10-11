import { beforeEach, describe, expect, test, vi } from "vitest";

import { LIFETIME } from "@/di/contracts/_module-exports.js";
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
    let container: Container;
    let start1: Mock<ITransactionAdapter["start"]>;
    let start2: Mock<ITransactionAdapter["start"]>;

    describe("LIFETIME.SINGLETON:", () => {
        beforeEach(async () => {
            vi.restoreAllMocks();
            vi.clearAllMocks();

            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            container = new Container({ executionContext });

            const adapter1 = new NoOpTransactionAdapter(null);
            start1 = vi.spyOn(adapter1, "start");

            const adapter2 = new NoOpTransactionAdapter(null);
            start2 = vi.spyOn(adapter2, "start");

            container.registerFactory({
                token: TransactionContextResolver,
                factory: () => {
                    const resolver = new TransactionContextResolver<Adapters>({
                        adapters: {
                            adapter1,
                            adapter2,
                        },
                        defaultAdapter: "adapter1",
                        executionContext,
                    });
                    return resolver;
                },
                onInit: async (factory) => {
                    await factory.init();
                },
                deps: {},
                lifetime: LIFETIME.SINGLETON,
            });
            transactionContext = new ProxyTransactionContextResolver<Adapters>({
                container,
                resolverToken: TransactionContextResolver,
            });

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
        test("Runs afterCommit callbacks for different adapters:", async () => {
            const afterCommit1 = vi.fn(() => Promise.resolve());

            await transactionContext.use("adapter1").run(async () => {
                await transactionContext.afterCommit(afterCommit1);
            });
            expect(afterCommit1).toHaveBeenCalledOnce();

            const afterCommit2 = vi.fn(() => Promise.resolve());
            await transactionContext.use("adapter2").run(async () => {
                await transactionContext.afterCommit(afterCommit2);
            });
            expect(afterCommit2).toHaveBeenCalledOnce();
        });
    });
    describe("LIFETIME.TRANSIENT:", () => {
        beforeEach(async () => {
            vi.restoreAllMocks();
            vi.clearAllMocks();

            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            container = new Container({ executionContext });

            const adapter1 = new NoOpTransactionAdapter(null);
            start1 = vi.spyOn(adapter1, "start");

            const adapter2 = new NoOpTransactionAdapter(null);
            start2 = vi.spyOn(adapter2, "start");

            container.registerFactory({
                token: TransactionContextResolver,
                factory: async () => {
                    const resolver = new TransactionContextResolver<Adapters>({
                        adapters: {
                            adapter1,
                            adapter2,
                        },
                        defaultAdapter: "adapter1",
                        executionContext,
                    });
                    await resolver.init();
                    return resolver;
                },
                deps: {},
                lifetime: LIFETIME.TRANSIENT,
            });
            transactionContext = new ProxyTransactionContextResolver<Adapters>({
                container,
                resolverToken: TransactionContextResolver,
            });

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
        test("Runs afterCommit callbacks for different adapters:", async () => {
            const afterCommit1 = vi.fn(() => Promise.resolve());

            await transactionContext.use("adapter1").run(async () => {
                await transactionContext.afterCommit(afterCommit1);
            });
            expect(afterCommit1).toHaveBeenCalledOnce();

            const afterCommit2 = vi.fn(() => Promise.resolve());
            await transactionContext.use("adapter2").run(async () => {
                await transactionContext.afterCommit(afterCommit2);
            });
            expect(afterCommit2).toHaveBeenCalledOnce();
        });
    });
    describe("LIFETIME.SCOPED:", () => {
        beforeEach(async () => {
            vi.restoreAllMocks();
            vi.clearAllMocks();

            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            container = new Container({ executionContext });

            const adapter1 = new NoOpTransactionAdapter(null);
            start1 = vi.spyOn(adapter1, "start");

            const adapter2 = new NoOpTransactionAdapter(null);
            start2 = vi.spyOn(adapter2, "start");

            container.registerFactory({
                token: TransactionContextResolver,
                factory: async () => {
                    const resolver = new TransactionContextResolver<Adapters>({
                        adapters: {
                            adapter1,
                            adapter2,
                        },
                        defaultAdapter: "adapter1",
                        executionContext,
                    });
                    await resolver.init();
                    return resolver;
                },
                deps: {},
                lifetime: LIFETIME.SCOPED,
            });
            transactionContext = new ProxyTransactionContextResolver<Adapters>({
                container,
                resolverToken: TransactionContextResolver,
            });

            await container.init();
        });

        test("Default adapter:", async () => {
            await container.run({
                scope: async () => {
                    await transactionContext.run(async () => {});
                },
            });

            expect(start1).toHaveBeenCalledExactlyOnceWith();
            expect(start2).not.toHaveBeenCalled();
        });
        test("Adapter 1:", async () => {
            await container.run({
                scope: async () => {
                    await transactionContext
                        .use("adapter1")
                        .run(async () => {});
                },
            });

            expect(start1).toHaveBeenCalledExactlyOnceWith();
            expect(start2).not.toHaveBeenCalled();
        });
        test("Adapter 2:", async () => {
            await container.run({
                scope: async () => {
                    await transactionContext
                        .use("adapter2")
                        .run(async () => {});
                },
            });

            expect(start2).toHaveBeenCalledExactlyOnceWith();
            expect(start1).not.toHaveBeenCalled();
        });
        test("Runs afterCommit callbacks for different adapters:", async () => {
            const afterCommit1 = vi.fn(() => Promise.resolve());
            await container.run({
                scope: async () => {
                    await transactionContext.use("adapter1").run(async () => {
                        await transactionContext.afterCommit(afterCommit1);
                    });
                },
            });
            expect(afterCommit1).toHaveBeenCalledOnce();

            const afterCommit2 = vi.fn(() => Promise.resolve());
            await container.run({
                scope: async () => {
                    await transactionContext.use("adapter2").run(async () => {
                        await transactionContext.afterCommit(afterCommit2);
                    });
                },
            });
            expect(afterCommit2).toHaveBeenCalledOnce();
        });
    });
});
