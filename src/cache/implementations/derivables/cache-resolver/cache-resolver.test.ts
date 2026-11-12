import { beforeEach, describe, expect, test, vi } from "vitest";

import { NoOpCacheAdapter } from "@/cache/implementations/adapters/no-op-cache-adapter/no-op-cache-adapter.js";
import {
    Cache,
    CacheResolver,
} from "@/cache/implementations/derivables/_module-exports.js";
import {
    DefaultAdapterNotDefinedError,
    UnregisteredAdapterError,
} from "@/utilities/_module-exports.js";

describe("class: CacheResolver", () => {
    type Adapters = "adapter1" | "adapter2" | "adapter3";
    const adapter1 = new NoOpCacheAdapter();
    const adapter2 = new NoOpCacheAdapter();
    const resolver = new CacheResolver<Adapters>({
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
            const resolverWithoutDefaultAdapter = new CacheResolver<Adapters>({
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

        test("Should return the cache of the registered adapter when called with its name", () => {
            expect(resolver.use("adapter1")).toBeInstanceOf(Cache);
            expect(resolver.use("adapter2")).not.toBe(resolver.use("adapter1"));
        });

        test("Should call the default adapter when called without arguments", async () => {
            const adapter1Spy = vi.spyOn(adapter1, "get");
            const adapter2Spy = vi.spyOn(adapter2, "get");

            await resolver.use().get("a");

            expect(adapter1Spy).toHaveBeenCalledOnce();
            expect(adapter2Spy).not.toHaveBeenCalled();
        });

        test("Should call the explicitly selected adapter when called with its name", async () => {
            const adapter1Spy = vi.spyOn(adapter1, "get");
            const adapter2Spy = vi.spyOn(adapter2, "get");

            await resolver.use("adapter2").get("a");

            expect(adapter2Spy).toHaveBeenCalledOnce();
            expect(adapter1Spy).not.toHaveBeenCalled();
        });
    });
});
