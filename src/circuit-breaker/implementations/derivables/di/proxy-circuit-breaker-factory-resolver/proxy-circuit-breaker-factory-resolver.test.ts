import { beforeEach, describe, expect, test, vi } from "vitest";

import { NoOpCircuitBreakerAdapter } from "@/circuit-breaker/implementations/adapters/no-op-circuit-breaker-adapter/no-op-circuit-breaker-adapter.js";
import { CircuitBreakerFactoryResolver } from "@/circuit-breaker/implementations/derivables/_module-exports.js";
import { ProxyCircuitBreakerFactoryResolver } from "@/circuit-breaker/implementations/derivables/di/proxy-circuit-breaker-factory-resolver/proxy-circuit-breaker-factory-resolver.js";
import { LIFETIME } from "@/di/contracts/_module-exports.js";
import { Container } from "@/di/implementations/eager/_module-exports.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";
import { SuperJsonSerdeAdapter } from "@/serde/implementations/adapters/super-json-serde-adapter/_module-exports.js";
import { Serde } from "@/serde/implementations/derivables/_module-exports.js";

import type { Mock } from "vitest";

import type {
    ICircuitBreaker,
    ICircuitBreakerAdapter,
    ICircuitBreakerFactory,
    ICircuitBreakerFactoryResolver,
} from "@/circuit-breaker/contracts/_module-exports.js";

describe("class: ProxyCircuitBreakerFactoryResolver", () => {
    type Adapters = "adapter1" | "adapter2";
    let circuitBreakerFactory: ICircuitBreakerFactoryResolver<Adapters> &
        ICircuitBreakerFactory;
    let container: Container;
    let getState1: Mock<ICircuitBreakerAdapter["getState"]>;
    let getState2: Mock<ICircuitBreakerAdapter["getState"]>;
    let serde: Serde<string>;

    describe("LIFETIME.SINGLETON:", () => {
        beforeEach(async () => {
            vi.restoreAllMocks();
            vi.clearAllMocks();

            serde = new Serde(new SuperJsonSerdeAdapter());

            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            container = new Container({
                executionContext,
            });

            const adapter1 = new NoOpCircuitBreakerAdapter();
            getState1 = vi.spyOn(adapter1, "getState");

            const adapter2 = new NoOpCircuitBreakerAdapter();
            getState2 = vi.spyOn(adapter2, "getState");

            container.registerFactory({
                token: CircuitBreakerFactoryResolver,
                factory: () => {
                    return new CircuitBreakerFactoryResolver<Adapters>({
                        adapters: {
                            adapter1,
                            adapter2,
                        },
                        defaultAdapter: "adapter1",
                        serde,
                    });
                },
                deps: {},
                lifetime: LIFETIME.SINGLETON,
            });
            circuitBreakerFactory =
                new ProxyCircuitBreakerFactoryResolver<Adapters>(
                    container,
                    CircuitBreakerFactoryResolver,
                );

            await container.init();
        });

        test("Default adapter:", async () => {
            const key = "a";
            await circuitBreakerFactory.create(key).getState();

            const args: Parameters<ICircuitBreakerAdapter["getState"]> = [key];

            expect(getState1).toHaveBeenCalledExactlyOnceWith(...args);
            expect(getState2).not.toHaveBeenCalled();
        });
        test("Adapter 1:", async () => {
            const key = "a";
            await circuitBreakerFactory.use("adapter1").create(key).getState();

            const args: Parameters<ICircuitBreakerAdapter["getState"]> = [key];

            expect(getState1).toHaveBeenCalledExactlyOnceWith(...args);
            expect(getState2).not.toHaveBeenCalled();
        });
        test("Adapter 2:", async () => {
            const key = "a";
            await circuitBreakerFactory.use("adapter2").create(key).getState();

            const args: Parameters<ICircuitBreakerAdapter["getState"]> = [key];

            expect(getState2).toHaveBeenCalledExactlyOnceWith(...args);
            expect(getState1).not.toHaveBeenCalled();
        });

        describe("Serde tests:", () => {
            test("Should serialize and deserialize a circuit breaker created with the default adapter", async () => {
                const key = "a";
                const circuitBreaker = circuitBreakerFactory.create(key);

                const deserializedCircuitBreaker =
                    serde.deserialize<ICircuitBreaker>(
                        serde.serialize(circuitBreaker),
                    );

                await deserializedCircuitBreaker.getState();

                const args: Parameters<ICircuitBreakerAdapter["getState"]> = [
                    key,
                ];

                expect(getState1).toHaveBeenCalledExactlyOnceWith(...args);
                expect(getState2).not.toHaveBeenCalled();
            });
            test("Should serialize and deserialize a circuit breaker created with a specific adapter", async () => {
                const key = "a";
                const circuitBreaker = circuitBreakerFactory
                    .use("adapter2")
                    .create(key);

                const deserializedCircuitBreaker =
                    serde.deserialize<ICircuitBreaker>(
                        serde.serialize(circuitBreaker),
                    );

                await deserializedCircuitBreaker.getState();

                const args: Parameters<ICircuitBreakerAdapter["getState"]> = [
                    key,
                ];

                expect(getState2).toHaveBeenCalledExactlyOnceWith(...args);
                expect(getState1).not.toHaveBeenCalled();
            });
        });
    });
    describe("LIFETIME.TRANSIENT:", () => {
        beforeEach(async () => {
            vi.restoreAllMocks();
            vi.clearAllMocks();

            serde = new Serde(new SuperJsonSerdeAdapter());

            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            container = new Container({
                executionContext,
            });

            const adapter1 = new NoOpCircuitBreakerAdapter();
            getState1 = vi.spyOn(adapter1, "getState");

            const adapter2 = new NoOpCircuitBreakerAdapter();
            getState2 = vi.spyOn(adapter2, "getState");

            container.registerFactory({
                token: CircuitBreakerFactoryResolver,
                factory: () => {
                    return new CircuitBreakerFactoryResolver<Adapters>({
                        adapters: {
                            adapter1,
                            adapter2,
                        },
                        defaultAdapter: "adapter1",
                        serde,
                    });
                },
                deps: {},
                lifetime: LIFETIME.TRANSIENT,
            });
            circuitBreakerFactory =
                new ProxyCircuitBreakerFactoryResolver<Adapters>(
                    container,
                    CircuitBreakerFactoryResolver,
                );

            await container.init();
        });

        test("Default adapter:", async () => {
            const key = "a";
            await circuitBreakerFactory.create(key).getState();

            const args: Parameters<ICircuitBreakerAdapter["getState"]> = [key];

            expect(getState1).toHaveBeenCalledExactlyOnceWith(...args);
            expect(getState2).not.toHaveBeenCalled();
        });
        test("Adapter 1:", async () => {
            const key = "a";
            await circuitBreakerFactory.use("adapter1").create(key).getState();

            const args: Parameters<ICircuitBreakerAdapter["getState"]> = [key];

            expect(getState1).toHaveBeenCalledExactlyOnceWith(...args);
            expect(getState2).not.toHaveBeenCalled();
        });
        test("Adapter 2:", async () => {
            const key = "a";
            await circuitBreakerFactory.use("adapter2").create(key).getState();

            const args: Parameters<ICircuitBreakerAdapter["getState"]> = [key];

            expect(getState2).toHaveBeenCalledExactlyOnceWith(...args);
            expect(getState1).not.toHaveBeenCalled();
        });

        describe("Serde tests:", () => {
            test("Should serialize and deserialize a circuit breaker created with the default adapter", async () => {
                const key = "a";
                const circuitBreaker = circuitBreakerFactory.create(key);

                const deserializedCircuitBreaker =
                    serde.deserialize<ICircuitBreaker>(
                        serde.serialize(circuitBreaker),
                    );

                await deserializedCircuitBreaker.getState();

                const args: Parameters<ICircuitBreakerAdapter["getState"]> = [
                    key,
                ];

                expect(getState1).toHaveBeenCalledExactlyOnceWith(...args);
                expect(getState2).not.toHaveBeenCalled();
            });
            test("Should serialize and deserialize a circuit breaker created with a specific adapter", async () => {
                const key = "a";
                const circuitBreaker = circuitBreakerFactory
                    .use("adapter2")
                    .create(key);

                const deserializedCircuitBreaker =
                    serde.deserialize<ICircuitBreaker>(
                        serde.serialize(circuitBreaker),
                    );

                await deserializedCircuitBreaker.getState();

                const args: Parameters<ICircuitBreakerAdapter["getState"]> = [
                    key,
                ];

                expect(getState2).toHaveBeenCalledExactlyOnceWith(...args);
                expect(getState1).not.toHaveBeenCalled();
            });
        });
    });
    describe("LIFETIME.SCOPED:", () => {
        beforeEach(async () => {
            vi.restoreAllMocks();
            vi.clearAllMocks();

            serde = new Serde(new SuperJsonSerdeAdapter());

            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            container = new Container({
                executionContext,
            });

            const adapter1 = new NoOpCircuitBreakerAdapter();
            getState1 = vi.spyOn(adapter1, "getState");

            const adapter2 = new NoOpCircuitBreakerAdapter();
            getState2 = vi.spyOn(adapter2, "getState");

            container.registerFactory({
                token: CircuitBreakerFactoryResolver,
                factory: () => {
                    return new CircuitBreakerFactoryResolver<Adapters>({
                        adapters: {
                            adapter1,
                            adapter2,
                        },
                        defaultAdapter: "adapter1",
                        serde,
                    });
                },
                deps: {},
                lifetime: LIFETIME.SCOPED,
            });
            circuitBreakerFactory =
                new ProxyCircuitBreakerFactoryResolver<Adapters>(
                    container,
                    CircuitBreakerFactoryResolver,
                );

            await container.init();
        });

        test("Default adapter:", async () => {
            const key = "a";
            await container.run({
                scope: async () => {
                    await circuitBreakerFactory.create(key).getState();
                },
            });

            const args: Parameters<ICircuitBreakerAdapter["getState"]> = [key];

            expect(getState1).toHaveBeenCalledExactlyOnceWith(...args);
            expect(getState2).not.toHaveBeenCalled();
        });
        test("Adapter 1:", async () => {
            const key = "a";
            await container.run({
                scope: async () => {
                    await circuitBreakerFactory
                        .use("adapter1")
                        .create(key)
                        .getState();
                },
            });

            const args: Parameters<ICircuitBreakerAdapter["getState"]> = [key];

            expect(getState1).toHaveBeenCalledExactlyOnceWith(...args);
            expect(getState2).not.toHaveBeenCalled();
        });
        test("Adapter 2:", async () => {
            const key = "a";
            await container.run({
                scope: async () => {
                    await circuitBreakerFactory
                        .use("adapter2")
                        .create(key)
                        .getState();
                },
            });

            const args: Parameters<ICircuitBreakerAdapter["getState"]> = [key];

            expect(getState2).toHaveBeenCalledExactlyOnceWith(...args);
            expect(getState1).not.toHaveBeenCalled();
        });

        describe("Serde tests:", () => {
            test("Should serialize and deserialize a circuit breaker created with the default adapter", async () => {
                const key = "a";
                const circuitBreaker = circuitBreakerFactory.create(key);

                const deserializedCircuitBreaker =
                    serde.deserialize<ICircuitBreaker>(
                        serde.serialize(circuitBreaker),
                    );

                await deserializedCircuitBreaker.getState();

                const args: Parameters<ICircuitBreakerAdapter["getState"]> = [
                    key,
                ];

                expect(getState1).toHaveBeenCalledExactlyOnceWith(...args);
                expect(getState2).not.toHaveBeenCalled();
            });
            test("Should serialize and deserialize a circuit breaker created with a specific adapter", async () => {
                const key = "a";
                const circuitBreaker = circuitBreakerFactory
                    .use("adapter2")
                    .create(key);

                const deserializedCircuitBreaker =
                    serde.deserialize<ICircuitBreaker>(
                        serde.serialize(circuitBreaker),
                    );

                await deserializedCircuitBreaker.getState();

                const args: Parameters<ICircuitBreakerAdapter["getState"]> = [
                    key,
                ];

                expect(getState2).toHaveBeenCalledExactlyOnceWith(...args);
                expect(getState1).not.toHaveBeenCalled();
            });
        });
    });
});
