import { beforeEach, describe, expect, test, vi } from "vitest";

import { NoOpEventBusAdapter } from "@/event-bus/implementations/adapters/no-op-event-bus-adapter/no-op-event-bus-adapter.js";
import {
    EventBus,
    EventBusResolver,
} from "@/event-bus/implementations/derivables/_module-exports.js";
import {
    DefaultAdapterNotDefinedError,
    UnregisteredAdapterError,
} from "@/utilities/_module-exports.js";

describe("class: EventBusResolver", () => {
    type Adapters = "adapter1" | "adapter2" | "adapter3";
    type Events = {
        event1: { value: string };
    };
    const adapter1 = new NoOpEventBusAdapter();
    const adapter2 = new NoOpEventBusAdapter();
    const resolver = new EventBusResolver<Adapters, Events>({
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
            const resolverWithoutDefaultAdapter = new EventBusResolver<
                Adapters,
                Events
            >({
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

        test("Should return the event bus of the registered adapter when called with its name", () => {
            expect(resolver.use("adapter1")).toBeInstanceOf(EventBus);
            expect(resolver.use("adapter2")).not.toBe(resolver.use("adapter1"));
        });

        test("Should call the default adapter when called without arguments", async () => {
            const adapter1Spy = vi.spyOn(adapter1, "dispatch");
            const adapter2Spy = vi.spyOn(adapter2, "dispatch");

            await resolver.use().dispatch("event1", { value: "a" });

            expect(adapter1Spy).toHaveBeenCalledOnce();
            expect(adapter2Spy).not.toHaveBeenCalled();
        });

        test("Should call the explicitly selected adapter when called with its name", async () => {
            const adapter1Spy = vi.spyOn(adapter1, "dispatch");
            const adapter2Spy = vi.spyOn(adapter2, "dispatch");

            await resolver.use("adapter2").dispatch("event1", { value: "a" });

            expect(adapter2Spy).toHaveBeenCalledOnce();
            expect(adapter1Spy).not.toHaveBeenCalled();
        });
    });
});
