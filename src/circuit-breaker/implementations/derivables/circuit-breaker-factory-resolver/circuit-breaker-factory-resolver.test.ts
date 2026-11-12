import { beforeEach, describe, expect, test, vi } from "vitest";

import { NoOpCircuitBreakerAdapter } from "@/circuit-breaker/implementations/adapters/no-op-circuit-breaker-adapter/no-op-circuit-breaker-adapter.js";
import {
    CircuitBreakerFactory,
    CircuitBreakerFactoryResolver,
} from "@/circuit-breaker/implementations/derivables/_module-exports.js";
import {
    DefaultAdapterNotDefinedError,
    UnregisteredAdapterError,
} from "@/utilities/_module-exports.js";

describe("class: CircuitBreakerFactoryResolver", () => {
    type Adapters = "adapter1" | "adapter2" | "adapter3";
    const adapter1 = new NoOpCircuitBreakerAdapter();
    const adapter2 = new NoOpCircuitBreakerAdapter();
    const resolver = new CircuitBreakerFactoryResolver<Adapters>({
        adapters: {
            adapter1,
            adapter2,
        },
        defaultAdapter: "adapter1",
    });
    resolver.init();

    beforeEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
    });

    describe("Method: use", () => {
        test("Should throw DefaultAdapterNotDefinedError when called without arguments and no default adapter is configured", () => {
            const resolverWithoutDefaultAdapter =
                new CircuitBreakerFactoryResolver<Adapters>({
                    adapters: {
                        adapter1,
                        adapter2,
                    },
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

        test("Should return the circuit breaker factory of the registered adapter when called with its name", () => {
            expect(resolver.use("adapter1")).toBeInstanceOf(
                CircuitBreakerFactory,
            );
            expect(resolver.use("adapter2")).not.toBe(resolver.use("adapter1"));
        });

        test("Should call the default adapter when called without arguments", async () => {
            const adapter1Spy = vi.spyOn(adapter1, "reset");
            const adapter2Spy = vi.spyOn(adapter2, "reset");

            await resolver.use().create("key").reset();

            expect(adapter1Spy).toHaveBeenCalledOnce();
            expect(adapter2Spy).not.toHaveBeenCalled();
        });

        test("Should call the explicitly selected adapter when called with its name", async () => {
            const adapter1Spy = vi.spyOn(adapter1, "reset");
            const adapter2Spy = vi.spyOn(adapter2, "reset");

            await resolver.use("adapter2").create("key").reset();

            expect(adapter2Spy).toHaveBeenCalledOnce();
            expect(adapter1Spy).not.toHaveBeenCalled();
        });
    });
});
