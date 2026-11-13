import { beforeEach, describe, expect, test, vi } from "vitest";

import { NoOpSemaphoreAdapter } from "@/semaphore/implementations/adapters/no-op-semaphore-adapter/no-op-semaphore-adapter.js";
import {
    SemaphoreFactory,
    SemaphoreFactoryResolver,
} from "@/semaphore/implementations/derivables/_module-exports.js";
import {
    DefaultAdapterNotDefinedError,
    UnregisteredAdapterError,
} from "@/utilities/_module-exports.js";

describe("class: SemaphoreFactoryResolver", () => {
    type Adapters = "adapter1" | "adapter2" | "adapter3";
    const adapter1 = new NoOpSemaphoreAdapter();
    const adapter2 = new NoOpSemaphoreAdapter();
    const resolver = new SemaphoreFactoryResolver<Adapters>({
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
                new SemaphoreFactoryResolver<Adapters>({
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

        test("Should return the semaphore factory of the registered adapter when called with its name", () => {
            expect(resolver.use("adapter1")).toBeInstanceOf(SemaphoreFactory);
            expect(resolver.use("adapter2")).not.toBe(resolver.use("adapter1"));
        });

        test("Should call the default adapter when called without arguments", async () => {
            const adapter1Spy = vi.spyOn(adapter1, "acquire");
            const adapter2Spy = vi.spyOn(adapter2, "acquire");

            await resolver.use().create("key", { limit: 1 }).acquire();

            expect(adapter1Spy).toHaveBeenCalledOnce();
            expect(adapter2Spy).not.toHaveBeenCalled();
        });

        test("Should call the explicitly selected adapter when called with its name", async () => {
            const adapter1Spy = vi.spyOn(adapter1, "acquire");
            const adapter2Spy = vi.spyOn(adapter2, "acquire");

            await resolver
                .use("adapter2")
                .create("key", { limit: 1 })
                .acquire();

            expect(adapter2Spy).toHaveBeenCalledOnce();
            expect(adapter1Spy).not.toHaveBeenCalled();
        });
    });
});
