import { beforeEach, describe, expect, test, vi } from "vitest";

import {
    IsolatedCircuitBreakerError,
    OpenCircuitBreakerError,
    CIRCUIT_BREAKER_TRIGGER,
    CIRCUIT_BREAKER_STATE,
} from "@/circuit-breaker/contracts/_module-exports.js";
import { DatabaseCircuitBreakerAdapter } from "@/circuit-breaker/implementations/adapters/database-circuit-breaker-adapter/_module-exports.js";
import { MemoryCircuitBreakerStorageAdapter } from "@/circuit-breaker/implementations/adapters/memory-circuit-breaker-storage-adapter/_module-exports.js";
import { CircuitBreakerFactory } from "@/circuit-breaker/implementations/derivables/circuit-breaker-factory/circuit-breaker-factory.js";
import { ConsecutiveBreaker } from "@/circuit-breaker/implementations/policies/_module-exports.js";
import { SuperJsonSerde } from "@/serde/implementations/super-json-serde/_module-exports.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";
import { delay } from "@/utilities/_module-exports.js";

import type {
    CircuitBreakerStateTransition,
    ICircuitBreakerAdapter,
    ICircuitBreakerFactory,
    CircuitBreakerState,
    ICircuitBreaker,
} from "@/circuit-breaker/contracts/_module-exports.js";

describe("class: CircuitBreakerFactory", () => {
    const adapter: ICircuitBreakerAdapter = {
        getState(_key: string): Promise<CircuitBreakerState> {
            throw new UnexpectedErrorA("Function not implemented.");
        },
        updateState(_key: string): Promise<CircuitBreakerStateTransition> {
            throw new UnexpectedErrorA("Function not implemented.");
        },
        isolate(_key: string): Promise<void> {
            throw new UnexpectedErrorA("Function not implemented.");
        },
        trackFailure(_key: string): Promise<void> {
            throw new UnexpectedErrorA("Function not implemented.");
        },
        trackSuccess(_key: string): Promise<void> {
            throw new UnexpectedErrorA("Function not implemented.");
        },
        reset(_key: string): Promise<void> {
            throw new UnexpectedErrorA("Function not implemented.");
        },
    };
    const KEY = "A";

    let circuitBreakerFactory: ICircuitBreakerFactory;
    const slowCallTime = TimeSpan.fromMilliseconds(50);
    beforeEach(() => {
        vi.resetAllMocks();
        vi.clearAllMocks();
        circuitBreakerFactory = new CircuitBreakerFactory({
            adapter,
            serde: new SuperJsonSerde(),
            defaultSlowCallTime: slowCallTime,
            enableAsyncTracking: false,
        });
    });

    class UnexpectedErrorA extends Error {}
    class UnexpectedErrorB extends Error {}

    describe("API tests:", () => {
        describe("method: runOrFail", () => {
            describe("CIRCUIT_BREAKER_TRIGGER.BOTH:", () => {
                test("Should call ICircuitBreakerAdapter.trackFailure when the function throws an error", async () => {
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve({
                            from: CIRCUIT_BREAKER_STATE.CLOSED,
                            to: CIRCUIT_BREAKER_STATE.CLOSED,
                        }),
                    );
                    const trackFailureSpy = vi
                        .spyOn(adapter, "trackFailure")
                        .mockImplementation(() => Promise.resolve());

                    const circuitBreaker = circuitBreakerFactory.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.BOTH,
                    });
                    try {
                        await circuitBreaker.runOrFail(() => {
                            return Promise.reject(
                                new UnexpectedErrorA("UNEXPECTED ERROR"),
                            );
                        });
                    } catch (error: unknown) {
                        if (!(error instanceof UnexpectedErrorA)) {
                            throw error;
                        }
                    }

                    expect(trackFailureSpy).toHaveBeenCalledOnce();
                });
                test("Should call ICircuitBreakerAdapter.trackFailure when the function exceedes the CircuitBreakerFactorySettings.slowCallTime", async () => {
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve({
                            from: CIRCUIT_BREAKER_STATE.CLOSED,
                            to: CIRCUIT_BREAKER_STATE.CLOSED,
                        }),
                    );
                    const trackFailureSpy = vi
                        .spyOn(adapter, "trackFailure")
                        .mockImplementation(() => Promise.resolve());

                    const circuitBreaker = circuitBreakerFactory.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.BOTH,
                    });
                    await circuitBreaker.runOrFail(async () => {
                        await delay(slowCallTime.addMilliseconds(10));
                    });

                    expect(trackFailureSpy).toHaveBeenCalledOnce();
                });
                test("Should call ICircuitBreakerAdapter.trackSuccess when the function does not throw an error and does not exceed the CircuitBreakerFactorySettings.slowCallTime", async () => {
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve({
                            from: CIRCUIT_BREAKER_STATE.CLOSED,
                            to: CIRCUIT_BREAKER_STATE.CLOSED,
                        }),
                    );
                    const trackSuccessSpy = vi
                        .spyOn(adapter, "trackSuccess")
                        .mockImplementation(() => Promise.resolve());

                    const circuitBreaker = circuitBreakerFactory.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.BOTH,
                    });
                    await circuitBreaker.runOrFail(async () => {});

                    expect(trackSuccessSpy).toHaveBeenCalledOnce();
                });
                test("Should not call ICircuitBreakerAdapter.trackFailure when given error doesnt match the error policy", async () => {
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve({
                            from: CIRCUIT_BREAKER_STATE.CLOSED,
                            to: CIRCUIT_BREAKER_STATE.CLOSED,
                        }),
                    );

                    const trackFailureSpy = vi
                        .spyOn(adapter, "trackFailure")
                        .mockImplementation(() => Promise.resolve());

                    const circuitBreaker = circuitBreakerFactory.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.BOTH,
                        errorPolicy: UnexpectedErrorA,
                    });
                    try {
                        await circuitBreaker.runOrFail(() => {
                            return Promise.reject(new UnexpectedErrorB());
                        });
                    } catch (error: unknown) {
                        if (!(error instanceof UnexpectedErrorB)) {
                            throw error;
                        }
                    }

                    expect(trackFailureSpy).not.toHaveBeenCalled();
                });
                test("Should throw OpenCircuitBreakerError when in OpenedState", async () => {
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve({
                            from: CIRCUIT_BREAKER_STATE.CLOSED,
                            to: CIRCUIT_BREAKER_STATE.OPEN,
                        }),
                    );
                    vi.spyOn(adapter, "trackFailure").mockImplementation(() =>
                        Promise.resolve(),
                    );

                    const circuitBreaker = circuitBreakerFactory.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.BOTH,
                    });
                    const promise = circuitBreaker.runOrFail(() => {
                        return Promise.reject(
                            new UnexpectedErrorA("UNEXPECTED ERROR"),
                        );
                    });
                    await expect(promise).rejects.toThrow(
                        OpenCircuitBreakerError,
                    );
                });
                test("Should throw IsolatedCircuitBreakerError when in IsolatedState", async () => {
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve({
                            from: CIRCUIT_BREAKER_STATE.CLOSED,
                            to: CIRCUIT_BREAKER_STATE.ISOLATED,
                        }),
                    );
                    vi.spyOn(adapter, "trackFailure").mockImplementation(() =>
                        Promise.resolve(),
                    );

                    const circuitBreaker = circuitBreakerFactory.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.BOTH,
                    });
                    const promise = circuitBreaker.runOrFail(() => {
                        return Promise.reject(
                            new UnexpectedErrorA("UNEXPECTED ERROR"),
                        );
                    });
                    await expect(promise).rejects.toThrow(
                        IsolatedCircuitBreakerError,
                    );
                });
            });
            describe("CIRCUIT_BREAKER_TRIGGER.ONLY_ERROR:", () => {
                test("Should call ICircuitBreakerAdapter.trackFailure when the function throws an error", async () => {
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve({
                            from: CIRCUIT_BREAKER_STATE.CLOSED,
                            to: CIRCUIT_BREAKER_STATE.CLOSED,
                        }),
                    );
                    const trackFailureSpy = vi
                        .spyOn(adapter, "trackFailure")
                        .mockImplementation(() => Promise.resolve());

                    const circuitBreaker = circuitBreakerFactory.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_ERROR,
                    });
                    try {
                        await circuitBreaker.runOrFail(() => {
                            return Promise.reject(
                                new UnexpectedErrorA("UNEXPECTED ERROR"),
                            );
                        });
                    } catch (error: unknown) {
                        if (!(error instanceof UnexpectedErrorA)) {
                            throw error;
                        }
                    }

                    expect(trackFailureSpy).toHaveBeenCalledOnce();
                });
                test("Should not call ICircuitBreakerAdapter.trackFailure when the function exceedes the CircuitBreakerFactorySettings.slowCallTime", async () => {
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve({
                            from: CIRCUIT_BREAKER_STATE.CLOSED,
                            to: CIRCUIT_BREAKER_STATE.CLOSED,
                        }),
                    );
                    vi.spyOn(adapter, "trackSuccess").mockImplementation(() =>
                        Promise.resolve(),
                    );
                    const trackFailureSpy = vi
                        .spyOn(adapter, "trackFailure")
                        .mockImplementation(() => Promise.resolve());

                    const circuitBreaker = circuitBreakerFactory.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_ERROR,
                    });
                    await circuitBreaker.runOrFail(async () => {
                        await delay(slowCallTime.addMilliseconds(10));
                    });

                    expect(trackFailureSpy).not.toHaveBeenCalled();
                });
                test("Should call ICircuitBreakerAdapter.trackSuccess when the function exceedes the CircuitBreakerFactorySettings.slowCallTime", async () => {
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve({
                            from: CIRCUIT_BREAKER_STATE.CLOSED,
                            to: CIRCUIT_BREAKER_STATE.CLOSED,
                        }),
                    );
                    vi.spyOn(adapter, "trackSuccess").mockImplementation(() =>
                        Promise.resolve(),
                    );
                    const trackSuccessSpy = vi
                        .spyOn(adapter, "trackSuccess")
                        .mockImplementation(() => Promise.resolve());

                    const circuitBreaker = circuitBreakerFactory.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_ERROR,
                    });
                    await circuitBreaker.runOrFail(async () => {
                        await delay(slowCallTime.addMilliseconds(10));
                    });

                    expect(trackSuccessSpy).toHaveBeenCalled();
                });
                test("Should call ICircuitBreakerAdapter.trackSuccess when the function does not throw an error", async () => {
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve({
                            from: CIRCUIT_BREAKER_STATE.CLOSED,
                            to: CIRCUIT_BREAKER_STATE.CLOSED,
                        }),
                    );
                    const trackSuccessSpy = vi
                        .spyOn(adapter, "trackSuccess")
                        .mockImplementation(() => Promise.resolve());

                    const circuitBreaker = circuitBreakerFactory.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_ERROR,
                    });
                    await circuitBreaker.runOrFail(async () => {});

                    expect(trackSuccessSpy).toHaveBeenCalledOnce();
                });
                test("Should not call ICircuitBreakerAdapter.trackFailure when given error doesnt match the error policy", async () => {
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve({
                            from: CIRCUIT_BREAKER_STATE.CLOSED,
                            to: CIRCUIT_BREAKER_STATE.CLOSED,
                        }),
                    );

                    const trackFailureSpy = vi
                        .spyOn(adapter, "trackFailure")
                        .mockImplementation(() => Promise.resolve());

                    const circuitBreaker = circuitBreakerFactory.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_ERROR,
                        errorPolicy: UnexpectedErrorA,
                    });
                    try {
                        await circuitBreaker.runOrFail(() => {
                            return Promise.reject(new UnexpectedErrorB());
                        });
                    } catch (error: unknown) {
                        if (!(error instanceof UnexpectedErrorB)) {
                            throw error;
                        }
                    }

                    expect(trackFailureSpy).not.toHaveBeenCalled();
                });
                test("Should throw OpenCircuitBreakerError when in OpenedState", async () => {
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve({
                            from: CIRCUIT_BREAKER_STATE.CLOSED,
                            to: CIRCUIT_BREAKER_STATE.OPEN,
                        }),
                    );
                    vi.spyOn(adapter, "trackFailure").mockImplementation(() =>
                        Promise.resolve(),
                    );

                    const circuitBreaker = circuitBreakerFactory.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_ERROR,
                    });
                    const promise = circuitBreaker.runOrFail(() => {
                        return Promise.reject(
                            new UnexpectedErrorA("UNEXPECTED ERROR"),
                        );
                    });
                    await expect(promise).rejects.toThrow(
                        OpenCircuitBreakerError,
                    );
                });
                test("Should throw IsolatedCircuitBreakerError when in IsolatedState", async () => {
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve({
                            from: CIRCUIT_BREAKER_STATE.CLOSED,
                            to: CIRCUIT_BREAKER_STATE.ISOLATED,
                        }),
                    );
                    vi.spyOn(adapter, "trackFailure").mockImplementation(() =>
                        Promise.resolve(),
                    );

                    const circuitBreaker = circuitBreakerFactory.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_ERROR,
                    });
                    const promise = circuitBreaker.runOrFail(() => {
                        return Promise.reject(
                            new UnexpectedErrorA("UNEXPECTED ERROR"),
                        );
                    });
                    await expect(promise).rejects.toThrow(
                        IsolatedCircuitBreakerError,
                    );
                });
            });
            describe("CIRCUIT_BREAKER_TRIGGER.ONLY_SLOW_CALL:", () => {
                test("Should not call ICircuitBreakerAdapter.trackFailure when the function throws an error", async () => {
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve({
                            from: CIRCUIT_BREAKER_STATE.CLOSED,
                            to: CIRCUIT_BREAKER_STATE.CLOSED,
                        }),
                    );
                    const trackFailureSpy = vi
                        .spyOn(adapter, "trackFailure")
                        .mockImplementation(() => Promise.resolve());

                    const circuitBreaker = circuitBreakerFactory.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_SLOW_CALL,
                    });
                    try {
                        await circuitBreaker.runOrFail(() => {
                            return Promise.reject(
                                new UnexpectedErrorA("UNEXPECTED ERROR"),
                            );
                        });
                    } catch (error: unknown) {
                        if (!(error instanceof UnexpectedErrorA)) {
                            throw error;
                        }
                    }

                    expect(trackFailureSpy).not.toHaveBeenCalled();
                });
                test("Should call ICircuitBreakerAdapter.trackFailure when the function exceedes the CircuitBreakerFactorySettings.slowCallTime", async () => {
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve({
                            from: CIRCUIT_BREAKER_STATE.CLOSED,
                            to: CIRCUIT_BREAKER_STATE.CLOSED,
                        }),
                    );
                    const trackFailureSpy = vi
                        .spyOn(adapter, "trackFailure")
                        .mockImplementation(() => Promise.resolve());

                    const circuitBreaker = circuitBreakerFactory.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_SLOW_CALL,
                    });
                    await circuitBreaker.runOrFail(async () => {
                        await delay(slowCallTime.addMilliseconds(10));
                    });

                    expect(trackFailureSpy).toHaveBeenCalledOnce();
                });
                test("Should call ICircuitBreakerAdapter.trackSuccess when does not exceed the CircuitBreakerFactorySettings.slowCallTime", async () => {
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve({
                            from: CIRCUIT_BREAKER_STATE.CLOSED,
                            to: CIRCUIT_BREAKER_STATE.CLOSED,
                        }),
                    );
                    const trackSuccessSpy = vi
                        .spyOn(adapter, "trackSuccess")
                        .mockImplementation(() => Promise.resolve());

                    const circuitBreaker = circuitBreakerFactory.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_SLOW_CALL,
                    });
                    await circuitBreaker.runOrFail(async () => {});

                    expect(trackSuccessSpy).toHaveBeenCalledOnce();
                });
                test("Should not call ICircuitBreakerAdapter.trackFailure when given error doesnt match the error policy", async () => {
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve({
                            from: CIRCUIT_BREAKER_STATE.CLOSED,
                            to: CIRCUIT_BREAKER_STATE.CLOSED,
                        }),
                    );

                    const trackFailureSpy = vi
                        .spyOn(adapter, "trackFailure")
                        .mockImplementation(() => Promise.resolve());

                    const circuitBreaker = circuitBreakerFactory.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_SLOW_CALL,
                        errorPolicy: UnexpectedErrorA,
                    });
                    try {
                        await circuitBreaker.runOrFail(() => {
                            return Promise.reject(new UnexpectedErrorB());
                        });
                    } catch (error: unknown) {
                        if (!(error instanceof UnexpectedErrorB)) {
                            throw error;
                        }
                    }

                    expect(trackFailureSpy).not.toHaveBeenCalled();
                });
                test("Should throw OpenCircuitBreakerError when in OpenedState", async () => {
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve({
                            from: CIRCUIT_BREAKER_STATE.CLOSED,
                            to: CIRCUIT_BREAKER_STATE.OPEN,
                        }),
                    );
                    vi.spyOn(adapter, "trackFailure").mockImplementation(() =>
                        Promise.resolve(),
                    );

                    const circuitBreaker = circuitBreakerFactory.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_SLOW_CALL,
                    });
                    const promise = circuitBreaker.runOrFail(() => {
                        return Promise.reject(
                            new UnexpectedErrorA("UNEXPECTED ERROR"),
                        );
                    });
                    await expect(promise).rejects.toThrow(
                        OpenCircuitBreakerError,
                    );
                });
                test("Should throw IsolatedCircuitBreakerError when in IsolatedState", async () => {
                    vi.spyOn(adapter, "updateState").mockImplementation(() =>
                        Promise.resolve({
                            from: CIRCUIT_BREAKER_STATE.CLOSED,
                            to: CIRCUIT_BREAKER_STATE.ISOLATED,
                        }),
                    );
                    vi.spyOn(adapter, "trackFailure").mockImplementation(() =>
                        Promise.resolve(),
                    );

                    const circuitBreaker = circuitBreakerFactory.create(KEY, {
                        trigger: CIRCUIT_BREAKER_TRIGGER.ONLY_SLOW_CALL,
                    });
                    const promise = circuitBreaker.runOrFail(() => {
                        return Promise.reject(
                            new UnexpectedErrorA("UNEXPECTED ERROR"),
                        );
                    });
                    await expect(promise).rejects.toThrow(
                        IsolatedCircuitBreakerError,
                    );
                });
            });
        });
        describe("method: isolate", () => {
            test("Should call ICircuitBreakerAdapter.isolate", async () => {
                const isolateSpy = vi
                    .spyOn(adapter, "isolate")
                    .mockImplementation(() => Promise.resolve());

                const circuitBreaker = circuitBreakerFactory.create(KEY);

                await circuitBreaker.isolate();

                expect(isolateSpy).toHaveBeenCalledOnce();
            });
        });
        describe("method: reset", () => {
            test("Should call ICircuitBreakerAdapter.reset", async () => {
                const resetSpy = vi
                    .spyOn(adapter, "reset")
                    .mockImplementation(() => Promise.resolve());

                const circuitBreaker = circuitBreakerFactory.create(KEY);

                await circuitBreaker.reset();

                expect(resetSpy).toHaveBeenCalledOnce();
            });
        });
    });
    describe("Serde tests:", () => {
        test("Should differentiate between different adapters", async () => {
            class WrapperCircuitBreakerAdapter implements ICircuitBreakerAdapter {
                constructor(
                    private readonly adapter_: ICircuitBreakerAdapter,
                ) {}

                getState(key: string): Promise<CircuitBreakerState> {
                    return this.adapter_.getState(key);
                }
                updateState(
                    key: string,
                ): Promise<CircuitBreakerStateTransition> {
                    return this.adapter_.updateState(key);
                }
                isolate(key: string): Promise<void> {
                    return this.adapter_.isolate(key);
                }
                trackFailure(key: string): Promise<void> {
                    return this.adapter_.trackFailure(key);
                }
                trackSuccess(key: string): Promise<void> {
                    return this.adapter_.trackSuccess(key);
                }
                reset(key: string): Promise<void> {
                    return this.adapter_.reset(key);
                }
            }

            const serde = new SuperJsonSerde();
            const key = "a";
            const circuitBreakerPolicy = new ConsecutiveBreaker({
                failureThreshold: 1,
                successThreshold: 1,
            });

            const circuitBreakerFactory1 = new CircuitBreakerFactory({
                adapter: new WrapperCircuitBreakerAdapter(
                    new DatabaseCircuitBreakerAdapter({
                        adapter: new MemoryCircuitBreakerStorageAdapter(),
                        circuitBreakerPolicy,
                    }),
                ),
                enableAsyncTracking: false,
                serde,
            });
            const circuitBreaker1 = circuitBreakerFactory1.create(key);
            try {
                await circuitBreaker1.runOrFail(() => {
                    return Promise.reject(
                        new UnexpectedErrorA("Unexpected error"),
                    );
                });
            } catch (error: unknown) {
                if (!(error instanceof UnexpectedErrorA)) {
                    throw error;
                }
            }

            const circuitBreakerFactory2 = new CircuitBreakerFactory({
                adapter: new DatabaseCircuitBreakerAdapter({
                    adapter: new MemoryCircuitBreakerStorageAdapter(),
                    circuitBreakerPolicy,
                }),
                enableAsyncTracking: false,
                serde,
            });
            const circuitBreaker2 = circuitBreakerFactory2.create(key);

            const deserializedCircuitBreaker2 =
                await serde.deserialize<ICircuitBreaker>(
                    await serde.serialize(circuitBreaker2),
                );
            const handler = vi.fn();
            await deserializedCircuitBreaker2.runOrFail(handler);
            expect(handler).toHaveBeenCalledOnce();
        });
        test("Should differentiate between different serializationIds", async () => {
            const serde = new SuperJsonSerde();
            const key = "a";
            const circuitBreakerPolicy = new ConsecutiveBreaker({
                failureThreshold: 1,
                successThreshold: 1,
            });

            const circuitBreakerFactory1 = new CircuitBreakerFactory({
                adapter: new DatabaseCircuitBreakerAdapter({
                    adapter: new MemoryCircuitBreakerStorageAdapter(),
                    circuitBreakerPolicy,
                }),
                enableAsyncTracking: false,
                serializationId: "adapter1",
                serde,
            });
            const circuitBreaker1 = circuitBreakerFactory1.create(key);
            try {
                await circuitBreaker1.runOrFail(() => {
                    return Promise.reject(
                        new UnexpectedErrorA("Unexpected error"),
                    );
                });
            } catch (error: unknown) {
                if (!(error instanceof UnexpectedErrorA)) {
                    throw error;
                }
            }

            const circuitBreakerFactory2 = new CircuitBreakerFactory({
                adapter: new DatabaseCircuitBreakerAdapter({
                    adapter: new MemoryCircuitBreakerStorageAdapter(),
                    circuitBreakerPolicy,
                }),
                enableAsyncTracking: false,
                serializationId: "adapter2",
                serde,
            });
            const circuitBreaker2 = circuitBreakerFactory2.create(key);

            const deserializedCircuitBreaker2 =
                await serde.deserialize<ICircuitBreaker>(
                    await serde.serialize(circuitBreaker2),
                );
            const handler = vi.fn();
            await deserializedCircuitBreaker2.runOrFail(handler);
            expect(handler).toHaveBeenCalledOnce();
        });
    });
});
