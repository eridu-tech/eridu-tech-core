import { describe, expect, test, vi } from "vitest";

import { contextToken } from "@/execution-context/contracts/_module.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module.js";
import {
    AbortTransactionError,
    CommitTransactionError,
    MandatoryPropagationError,
    NeverPropagationError,
    StartTransactionError,
    TRANSACTION_PROPAGATION,
} from "@/transaction-context/contracts/_module.js";
import { TransactionContext } from "@/transaction-context/implementations/derivables/transaction-context/transaction-context.js";
import { UnexpectedError } from "@/utilities/_module.js";

import type {
    ITransaction,
    ITransactionAdapter,
} from "@/transaction-context/contracts/_module.js";
import type { ITransactionData } from "@/transaction-context/implementations/derivables/transaction-context/transaction-context.js";

type Client = { readonly value: string };

const baseClient: Client = { value: "base" };
const transactionClient: Client = { value: "transaction" };

/**
 * Builds a `TransactionContext` backed by mockable adapter methods.
 *
 * The context copies the adapter it is given, so the adapter must expose its
 * methods as own properties (an object literal) for the mocks to be observable.
 */
function createTransactionContext() {
    const commit = vi.fn((): Promise<void> => Promise.resolve());
    const abort = vi.fn((): Promise<void> => Promise.resolve());
    const start = vi.fn((): Promise<ITransaction<Client> | null> =>
        Promise.resolve({
            client: transactionClient,
            commit,
            abort,
        }),
    );
    const adapter: ITransactionAdapter<Client, Client> = {
        client: baseClient,
        start,
    };
    const transactionContext = new TransactionContext<Client, Client>({
        token: contextToken<ITransactionData<Client>>("transaction"),
        adapter,
        executionContext: new ExecutionContext(
            new AlsExecutionContextAdapter(),
        ),
    });
    return { transactionContext, start, commit, abort };
}

async function captureError(promise: Promise<unknown>): Promise<unknown> {
    try {
        await promise;
        return null;
    } catch (error: unknown) {
        return error;
    }
}

describe("class: TransactionContext", () => {
    describe("getters:", () => {
        test("Should return the base client when no transaction is active", () => {
            const { transactionContext } = createTransactionContext();

            expect(transactionContext.client).toBe(baseClient);
            expect(transactionContext.transaction).toBeNull();
            expect(transactionContext.isInTransaction).toBe(false);
            expect(transactionContext.current).toBe(baseClient);
        });
        test("Should expose the transaction client while a transaction is active", async () => {
            const { transactionContext } = createTransactionContext();

            await transactionContext.run(
                TRANSACTION_PROPAGATION.REQUIRED,
                () => {
                    expect(transactionContext.client).toBe(baseClient);
                    expect(transactionContext.transaction).toBe(
                        transactionClient,
                    );
                    expect(transactionContext.current).toBe(transactionClient);
                    expect(transactionContext.isInTransaction).toBe(true);
                    return Promise.resolve();
                },
            );
        });
        test("Should reset the transaction state after run resolves", async () => {
            const { transactionContext } = createTransactionContext();

            await transactionContext.run(TRANSACTION_PROPAGATION.REQUIRED, () =>
                Promise.resolve("value"),
            );

            expect(transactionContext.transaction).toBeNull();
            expect(transactionContext.current).toBe(baseClient);
            expect(transactionContext.isInTransaction).toBe(false);
        });
    });
    describe("method: getTransactionOrFail", () => {
        test("Should throw a MandatoryPropagationError when no transaction is active", () => {
            const { transactionContext } = createTransactionContext();

            expect(() => transactionContext.getTransactionOrFail()).toThrow(
                MandatoryPropagationError,
            );
            expect(() => transactionContext.getTransactionOrFail()).toThrow(
                `Cannot run with transaction propagation "MANDATORY" when no transaction is active`,
            );
        });
        test("Should return the transaction client while a transaction is active", async () => {
            const { transactionContext } = createTransactionContext();

            await transactionContext.run(
                TRANSACTION_PROPAGATION.REQUIRED,
                () => {
                    expect(transactionContext.getTransactionOrFail()).toBe(
                        transactionClient,
                    );
                    return Promise.resolve();
                },
            );
        });
    });
    describe("method: run", () => {
        describe("TRANSACTION_PROPAGATION.REQUIRED", () => {
            test("Should start a transaction and commit it after the invocable succeeds", async () => {
                const { transactionContext, start, commit, abort } =
                    createTransactionContext();

                const result = await transactionContext.run(
                    TRANSACTION_PROPAGATION.REQUIRED,
                    () => Promise.resolve("value"),
                );

                expect(result).toBe("value");
                expect(start).toHaveBeenCalledOnce();
                expect(commit).toHaveBeenCalledOnce();
                expect(abort).not.toHaveBeenCalled();
            });
            test("Should use REQUIRED propagation when only an invocable is given", async () => {
                const { transactionContext, start, commit, abort } =
                    createTransactionContext();

                const result = await transactionContext.run(() =>
                    Promise.resolve("value"),
                );

                expect(result).toBe("value");
                expect(start).toHaveBeenCalledOnce();
                expect(commit).toHaveBeenCalledOnce();
                expect(abort).not.toHaveBeenCalled();
            });
            test("Should accept an invocable object", async () => {
                const { transactionContext, commit } =
                    createTransactionContext();
                const invoke = vi.fn(() => Promise.resolve("value"));

                const result = await transactionContext.run(
                    TRANSACTION_PROPAGATION.REQUIRED,
                    { invoke },
                );

                expect(result).toBe("value");
                expect(invoke).toHaveBeenCalledOnce();
                expect(commit).toHaveBeenCalledOnce();
            });
            test("Should wrap a start failure in a StartTransactionError", async () => {
                const { transactionContext, start, commit, abort } =
                    createTransactionContext();
                const startFailure = new Error("start failed");
                start.mockRejectedValueOnce(startFailure);
                const invocable = vi.fn(() => Promise.resolve("value"));

                const error = await captureError(
                    transactionContext.run(
                        TRANSACTION_PROPAGATION.REQUIRED,
                        invocable,
                    ),
                );

                expect(error).toBeInstanceOf(StartTransactionError);
                expect((error as StartTransactionError).name).toBe(
                    "StartTransactionError",
                );
                expect((error as StartTransactionError).message).toBe(
                    "Failed to start a transaction",
                );
                expect((error as StartTransactionError).cause).toBe(
                    startFailure,
                );
                expect(start).toHaveBeenCalledOnce();
                expect(invocable).not.toHaveBeenCalled();
                expect(commit).not.toHaveBeenCalled();
                expect(abort).not.toHaveBeenCalled();
            });
            test("Should wrap a commit failure in a CommitTransactionError and not abort", async () => {
                const { transactionContext, commit, abort } =
                    createTransactionContext();
                const commitFailure = new Error("commit failed");
                commit.mockRejectedValueOnce(commitFailure);

                const error = await captureError(
                    transactionContext.run(
                        TRANSACTION_PROPAGATION.REQUIRED,
                        () => Promise.resolve("value"),
                    ),
                );

                expect(error).toBeInstanceOf(CommitTransactionError);
                expect((error as CommitTransactionError).name).toBe(
                    "CommitTransactionError",
                );
                expect((error as CommitTransactionError).message).toBe(
                    "Failed to commit the transaction",
                );
                expect((error as CommitTransactionError).cause).toBe(
                    commitFailure,
                );
                expect(commit).toHaveBeenCalledOnce();
                expect(abort).not.toHaveBeenCalled();
            });
            test("Should abort and re-throw the invocable error when the invocable fails", async () => {
                const { transactionContext, commit, abort } =
                    createTransactionContext();
                const invocableError = new Error("callback failed");

                const error = await captureError(
                    transactionContext.run(
                        TRANSACTION_PROPAGATION.REQUIRED,
                        () => Promise.reject(invocableError),
                    ),
                );

                expect(error).toBe(invocableError);
                expect(commit).not.toHaveBeenCalled();
                expect(abort).toHaveBeenCalledOnce();
            });
            test("Should wrap an abort failure in an AbortTransactionError", async () => {
                const { transactionContext, abort } =
                    createTransactionContext();
                const abortFailure = new Error("abort failed");
                abort.mockRejectedValueOnce(abortFailure);
                const invocableError = new Error("callback failed");

                const error = await captureError(
                    transactionContext.run(
                        TRANSACTION_PROPAGATION.REQUIRED,
                        () => Promise.reject(invocableError),
                    ),
                );

                expect(error).toBeInstanceOf(AbortTransactionError);
                expect((error as AbortTransactionError).name).toBe(
                    "AbortTransactionError",
                );
                expect((error as AbortTransactionError).message).toBe(
                    "Failed to abort the transaction",
                );
                expect((error as AbortTransactionError).cause).toBe(
                    abortFailure,
                );
                expect(abort).toHaveBeenCalledOnce();
            });
            test("Should run the invocable outside a transaction when the adapter does not start a transaction", async () => {
                const { transactionContext, start, commit, abort } =
                    createTransactionContext();
                start.mockResolvedValueOnce(null);

                const result = await transactionContext.run(
                    TRANSACTION_PROPAGATION.REQUIRED,
                    () => {
                        expect(transactionContext.isInTransaction).toBe(false);
                        expect(transactionContext.transaction).toBeNull();
                        expect(transactionContext.current).toBe(baseClient);
                        return Promise.resolve("value");
                    },
                );

                expect(result).toBe("value");
                expect(start).toHaveBeenCalledOnce();
                expect(commit).not.toHaveBeenCalled();
                expect(abort).not.toHaveBeenCalled();
            });
            test("Should reuse the active transaction and not start a new one", async () => {
                const { transactionContext, start, commit, abort } =
                    createTransactionContext();

                await transactionContext.run(
                    TRANSACTION_PROPAGATION.REQUIRED,
                    async () => {
                        const nestedResult = await transactionContext.run(
                            TRANSACTION_PROPAGATION.REQUIRED,
                            () => Promise.resolve("nested"),
                        );
                        expect(nestedResult).toBe("nested");
                        expect(transactionContext.transaction).toBe(
                            transactionClient,
                        );
                    },
                );

                expect(start).toHaveBeenCalledOnce();
                expect(commit).toHaveBeenCalledOnce();
                expect(abort).not.toHaveBeenCalled();
            });
            test("Should start a new transaction for every sequential run", async () => {
                const { transactionContext, start, commit } =
                    createTransactionContext();

                await transactionContext.run(
                    TRANSACTION_PROPAGATION.REQUIRED,
                    () => Promise.resolve("first"),
                );
                await transactionContext.run(
                    TRANSACTION_PROPAGATION.REQUIRED,
                    () => Promise.resolve("second"),
                );

                expect(start).toHaveBeenCalledTimes(2);
                expect(commit).toHaveBeenCalledTimes(2);
            });
        });
        describe("TRANSACTION_PROPAGATION.SUPPORTS", () => {
            test("Should run the invocable without starting a transaction", async () => {
                const { transactionContext, start, commit, abort } =
                    createTransactionContext();

                const result = await transactionContext.run(
                    TRANSACTION_PROPAGATION.SUPPORTS,
                    () => Promise.resolve("value"),
                );

                expect(result).toBe("value");
                expect(start).not.toHaveBeenCalled();
                expect(commit).not.toHaveBeenCalled();
                expect(abort).not.toHaveBeenCalled();
            });
            test("Should propagate the invocable error without starting a transaction", async () => {
                const { transactionContext, start } =
                    createTransactionContext();
                const invocableError = new Error("callback failed");

                const error = await captureError(
                    transactionContext.run(
                        TRANSACTION_PROPAGATION.SUPPORTS,
                        () => Promise.reject(invocableError),
                    ),
                );

                expect(error).toBe(invocableError);
                expect(start).not.toHaveBeenCalled();
            });
            test("Should keep the transaction of the surrounding scope visible", async () => {
                const { transactionContext, start } =
                    createTransactionContext();

                await transactionContext.run(
                    TRANSACTION_PROPAGATION.REQUIRED,
                    () =>
                        transactionContext.run(
                            TRANSACTION_PROPAGATION.SUPPORTS,
                            () => {
                                expect(transactionContext.isInTransaction).toBe(
                                    true,
                                );
                                return Promise.resolve();
                            },
                        ),
                );

                expect(start).toHaveBeenCalledOnce();
            });
        });
        describe("TRANSACTION_PROPAGATION.MANDATORY", () => {
            test("Should throw a MandatoryPropagationError when no transaction is active", async () => {
                const { transactionContext, start } =
                    createTransactionContext();
                const invocable = vi.fn(() => Promise.resolve("value"));

                const error = await captureError(
                    transactionContext.run(
                        TRANSACTION_PROPAGATION.MANDATORY,
                        invocable,
                    ),
                );

                expect(error).toBeInstanceOf(MandatoryPropagationError);
                expect((error as MandatoryPropagationError).message).toBe(
                    `Cannot run with transaction propagation "MANDATORY" when no transaction is active`,
                );
                expect(invocable).not.toHaveBeenCalled();
                expect(start).not.toHaveBeenCalled();
            });
            test("Should run the invocable when a transaction is active", async () => {
                const { transactionContext, start, commit, abort } =
                    createTransactionContext();

                await transactionContext.run(
                    TRANSACTION_PROPAGATION.REQUIRED,
                    async () => {
                        const result = await transactionContext.run(
                            TRANSACTION_PROPAGATION.MANDATORY,
                            () => Promise.resolve("mandatory"),
                        );
                        expect(result).toBe("mandatory");
                    },
                );

                expect(start).toHaveBeenCalledOnce();
                expect(commit).toHaveBeenCalledOnce();
                expect(abort).not.toHaveBeenCalled();
            });
        });
        describe("TRANSACTION_PROPAGATION.NEVER", () => {
            test("Should run the invocable when no transaction is active", async () => {
                const { transactionContext, start } =
                    createTransactionContext();

                const result = await transactionContext.run(
                    TRANSACTION_PROPAGATION.NEVER,
                    () => Promise.resolve("value"),
                );

                expect(result).toBe("value");
                expect(start).not.toHaveBeenCalled();
            });
            test("Should throw a NeverPropagationError when a transaction is active", async () => {
                const { transactionContext, commit, abort } =
                    createTransactionContext();

                await transactionContext.run(
                    TRANSACTION_PROPAGATION.REQUIRED,
                    async () => {
                        const invocable = vi.fn(() => Promise.resolve());
                        const error = await captureError(
                            transactionContext.run(
                                TRANSACTION_PROPAGATION.NEVER,
                                invocable,
                            ),
                        );

                        expect(error).toBeInstanceOf(NeverPropagationError);
                        expect((error as NeverPropagationError).message).toBe(
                            `Cannot run with transaction propagation "NEVER" while a transaction is active`,
                        );
                        expect(invocable).not.toHaveBeenCalled();
                    },
                );

                expect(commit).toHaveBeenCalledOnce();
                expect(abort).not.toHaveBeenCalled();
            });
        });
        test("Should throw an UnexpectedError when a propagation mode is given without an invocable", () => {
            const { transactionContext } = createTransactionContext();

            expect(() => {
                // @ts-expect-error - a propagation mode must be accompanied by an invocable
                void transactionContext.run(TRANSACTION_PROPAGATION.REQUIRED);
            }).toThrow(UnexpectedError);
            expect(() => {
                // @ts-expect-error - a propagation mode must be accompanied by an invocable
                void transactionContext.run(TRANSACTION_PROPAGATION.REQUIRED);
            }).toThrow(
                "run() was called with a propagation mode but no asyncInvocable",
            );
        });
    });
    describe("method: afterCommit", () => {
        test("Should run the invocable after the transaction commits and before run resolves", async () => {
            const { transactionContext, commit } = createTransactionContext();
            const order: Array<string> = [];
            commit.mockImplementation(() => {
                order.push("commit");
                return Promise.resolve();
            });
            const hook = (): Promise<void> => {
                order.push("hook");
                return Promise.resolve();
            };

            await transactionContext.run(
                TRANSACTION_PROPAGATION.REQUIRED,
                async () => {
                    order.push("invocable");
                    await transactionContext.afterCommit(hook);
                    expect(order).toEqual(["invocable"]);
                },
            );
            order.push("after run");

            expect(order).toEqual(["invocable", "commit", "hook", "after run"]);
        });
        test("Should run multiple invocables in registration order", async () => {
            const { transactionContext } = createTransactionContext();
            const order: Array<string> = [];

            await transactionContext.run(
                TRANSACTION_PROPAGATION.REQUIRED,
                async () => {
                    await transactionContext.afterCommit(() => {
                        order.push("first");
                        return Promise.resolve();
                    });
                    await transactionContext.afterCommit(() => {
                        order.push("second");
                        return Promise.resolve();
                    });
                },
            );

            expect(order).toEqual(["first", "second"]);
        });
        test("Should accept an invocable object", async () => {
            const { transactionContext } = createTransactionContext();
            const invoke = vi.fn(() => Promise.resolve());

            await transactionContext.run(
                TRANSACTION_PROPAGATION.REQUIRED,
                async () => {
                    await transactionContext.afterCommit({ invoke });
                },
            );

            expect(invoke).toHaveBeenCalledOnce();
        });
        test("Should not run the invocable when the transaction is aborted", async () => {
            const { transactionContext, abort } = createTransactionContext();
            const hook = vi.fn(() => Promise.resolve());
            const invocableError = new Error("callback failed");

            const error = await captureError(
                transactionContext.run(
                    TRANSACTION_PROPAGATION.REQUIRED,
                    async () => {
                        await transactionContext.afterCommit(hook);
                        throw invocableError;
                    },
                ),
            );

            expect(error).toBe(invocableError);
            expect(abort).toHaveBeenCalledOnce();
            expect(hook).not.toHaveBeenCalled();
        });
        test("Should not keep the invocable for a later transaction", async () => {
            const { transactionContext } = createTransactionContext();
            const hook = vi.fn(() => Promise.resolve());

            await transactionContext.run(
                TRANSACTION_PROPAGATION.REQUIRED,
                async () => {
                    await transactionContext.afterCommit(hook);
                },
            );
            expect(hook).toHaveBeenCalledOnce();

            await transactionContext.run(TRANSACTION_PROPAGATION.REQUIRED, () =>
                Promise.resolve(),
            );

            expect(hook).toHaveBeenCalledOnce();
        });
        test("Should run the invocable immediately when no transaction is active", async () => {
            const { transactionContext, start } = createTransactionContext();
            const hook = vi.fn(() => Promise.resolve());

            await expect(
                transactionContext.afterCommit(hook),
            ).resolves.toBeUndefined();

            expect(hook).toHaveBeenCalledOnce();
            expect(start).not.toHaveBeenCalled();
        });
        test("Should run the invocable immediately when runIfNoTransaction is true and no transaction is active", async () => {
            const { transactionContext } = createTransactionContext();
            const hook = vi.fn(() => Promise.resolve());

            await transactionContext.afterCommit(hook, {
                runIfNoTransaction: true,
            });

            expect(hook).toHaveBeenCalledOnce();
        });
        test("Should skip the invocable when runIfNoTransaction is false and no transaction is active", async () => {
            const { transactionContext } = createTransactionContext();
            const hook = vi.fn(() => Promise.resolve());

            await transactionContext.afterCommit(hook, {
                runIfNoTransaction: false,
            });

            expect(hook).not.toHaveBeenCalled();
        });
        test("Should still run the invocable after commit when runIfNoTransaction is false and a transaction is active", async () => {
            const { transactionContext } = createTransactionContext();
            const hook = vi.fn(() => Promise.resolve());

            await transactionContext.run(
                TRANSACTION_PROPAGATION.REQUIRED,
                async () => {
                    await transactionContext.afterCommit(hook, {
                        runIfNoTransaction: false,
                    });
                    expect(hook).not.toHaveBeenCalled();
                },
            );

            expect(hook).toHaveBeenCalledOnce();
        });
        test("Should run the invocable immediately when the adapter does not start a transaction", async () => {
            const { transactionContext, start, commit, abort } =
                createTransactionContext();
            start.mockResolvedValueOnce(null);
            const hook = vi.fn(() => Promise.resolve());

            await transactionContext.run(
                TRANSACTION_PROPAGATION.REQUIRED,
                async () => {
                    await transactionContext.afterCommit(hook);
                    expect(hook).toHaveBeenCalledOnce();
                },
            );

            expect(commit).not.toHaveBeenCalled();
            expect(abort).not.toHaveBeenCalled();
        });
        test("Should wrap a failing invocable in a CommitTransactionError without aborting", async () => {
            const { transactionContext, abort } = createTransactionContext();
            const hookError = new Error("hook failed");

            const error = await captureError(
                transactionContext.run(
                    TRANSACTION_PROPAGATION.REQUIRED,
                    async () => {
                        await transactionContext.afterCommit(() =>
                            Promise.reject(hookError),
                        );
                    },
                ),
            );

            expect(error).toBeInstanceOf(CommitTransactionError);
            expect((error as CommitTransactionError).cause).toBe(hookError);
            expect(abort).not.toHaveBeenCalled();
        });
    });
    describe("static method: noOp", () => {
        test("Should expose the given client", () => {
            const transactionContext = TransactionContext.noOp(baseClient);

            expect(transactionContext.client).toBe(baseClient);
        });
        test("Should never track a transaction", async () => {
            const transactionContext = TransactionContext.noOp(baseClient);

            expect(transactionContext.isInTransaction).toBe(false);
            expect(transactionContext.transaction).toBeNull();
            expect(transactionContext.current).toBe(baseClient);

            await transactionContext.run(() => {
                expect(transactionContext.isInTransaction).toBe(false);
                expect(transactionContext.transaction).toBeNull();
                expect(transactionContext.current).toBe(baseClient);
                return Promise.resolve();
            });

            expect(transactionContext.isInTransaction).toBe(false);
            expect(transactionContext.transaction).toBeNull();
        });
        test("Should run the invocable directly and return its result", async () => {
            const transactionContext = TransactionContext.noOp(baseClient);
            const invocable = vi.fn(() => Promise.resolve("value"));

            const result = await transactionContext.run(invocable);

            expect(result).toBe("value");
            expect(invocable).toHaveBeenCalledOnce();
        });
        test("Should run the invocable for REQUIRED, SUPPORTS and NEVER propagation", async () => {
            const transactionContext = TransactionContext.noOp(baseClient);
            const invocable = vi.fn(() => Promise.resolve("value"));

            await expect(
                transactionContext.run(
                    TRANSACTION_PROPAGATION.REQUIRED,
                    invocable,
                ),
            ).resolves.toBe("value");
            await expect(
                transactionContext.run(
                    TRANSACTION_PROPAGATION.SUPPORTS,
                    invocable,
                ),
            ).resolves.toBe("value");
            await expect(
                transactionContext.run(
                    TRANSACTION_PROPAGATION.NEVER,
                    invocable,
                ),
            ).resolves.toBe("value");

            expect(invocable).toHaveBeenCalledTimes(3);
        });
        test("Should propagate the invocable error as-is", async () => {
            const transactionContext = TransactionContext.noOp(baseClient);
            const invocableError = new Error("callback failed");

            const error = await captureError(
                transactionContext.run(() => Promise.reject(invocableError)),
            );

            expect(error).toBe(invocableError);
        });
        test("Should throw a MandatoryPropagationError for MANDATORY propagation", async () => {
            const transactionContext = TransactionContext.noOp(baseClient);
            const invocable = vi.fn(() => Promise.resolve("value"));

            const error = await captureError(
                transactionContext.run(
                    TRANSACTION_PROPAGATION.MANDATORY,
                    invocable,
                ),
            );

            expect(error).toBeInstanceOf(MandatoryPropagationError);
            expect(invocable).not.toHaveBeenCalled();
        });
        test("Should throw a MandatoryPropagationError for nested MANDATORY propagation", async () => {
            const transactionContext = TransactionContext.noOp(baseClient);
            const invocable = vi.fn(() => Promise.resolve("value"));
            let nestedError: unknown = null;

            await transactionContext.run(async () => {
                nestedError = await captureError(
                    transactionContext.run(
                        TRANSACTION_PROPAGATION.MANDATORY,
                        invocable,
                    ),
                );
            });

            expect(nestedError).toBeInstanceOf(MandatoryPropagationError);
            expect(invocable).not.toHaveBeenCalled();
        });
        test("Should throw a MandatoryPropagationError from getTransactionOrFail", () => {
            const transactionContext = TransactionContext.noOp(baseClient);

            expect(() => transactionContext.getTransactionOrFail()).toThrow(
                MandatoryPropagationError,
            );
        });
        test("Should run afterCommit invocables immediately", async () => {
            const transactionContext = TransactionContext.noOp(baseClient);
            const hook = vi.fn(() => Promise.resolve());

            await expect(
                transactionContext.afterCommit(hook),
            ).resolves.toBeUndefined();

            expect(hook).toHaveBeenCalledOnce();
        });
        test("Should never run afterCommit invocables when runIfNoTransaction is false", async () => {
            const transactionContext = TransactionContext.noOp(baseClient);
            const hook = vi.fn(() => Promise.resolve());

            await transactionContext.afterCommit(hook, {
                runIfNoTransaction: false,
            });

            expect(hook).not.toHaveBeenCalled();
        });
    });
});
