import { EventEmitter } from "node:events";

import { beforeEach, describe, expect, test, vi } from "vitest";

import {
    genericToken,
    InvalidMethodCallDiError,
    LIFETIME,
} from "@/di/contracts/_module-exports.js";
import { Container } from "@/di/implementations/eager/_module-exports.js";
import { MemoryEventBusAdapter } from "@/event-bus/implementations/adapters/memory-event-bus-adapter/_module-exports.js";
import { EventBusResolver } from "@/event-bus/implementations/derivables/_module-exports.js";
import { ProxyEventBusResolver } from "@/event-bus/implementations/derivables/di/proxy-event-bus-resolver/proxy-event-bus-resolver.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";

import type { Mock } from "vitest";

import type { IEventBusAdapter } from "@/event-bus/contracts/_module-exports.js";

describe("class: ProxyEventBusResolver", () => {
    type Adapters = "adapter1" | "adapter2";
    type Events = {
        userCreated: {
            userId: string;
        };
    };

    let eventBus: ProxyEventBusResolver<Adapters, Events>;
    let container: Container;
    const resolverToken =
        genericToken<EventBusResolver<Adapters, Events>>("eventBusResolver");
    let dispatch1: Mock<IEventBusAdapter["dispatch"]>;
    let dispatch2: Mock<IEventBusAdapter["dispatch"]>;

    describe("LIFETIME.SINGLETON:", () => {
        beforeEach(() => {
            vi.restoreAllMocks();
            vi.clearAllMocks();

            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            container = new Container({ executionContext });

            const adapter1 = new MemoryEventBusAdapter({
                eventEmitter: new EventEmitter(),
            });
            dispatch1 = vi.spyOn(adapter1, "dispatch");

            const adapter2 = new MemoryEventBusAdapter({
                eventEmitter: new EventEmitter(),
            });
            dispatch2 = vi.spyOn(adapter2, "dispatch");

            container.registerFactory({
                token: resolverToken,
                factory: () => {
                    return new EventBusResolver<Adapters, Events>({
                        adapters: {
                            adapter1,
                            adapter2,
                        },
                        defaultAdapter: "adapter1",
                    });
                },
                onInit: async (resolver) => {
                    await resolver.init();
                },
                deps: {},
                lifetime: LIFETIME.SINGLETON,
            });
            eventBus = new ProxyEventBusResolver<Adapters, Events>({
                container,
                resolverToken,
            });
        });

        test("Default adapter:", async () => {
            await container.init();

            const event = { userId: "user-1" };
            await eventBus.use().dispatch("userCreated", event);

            expect(dispatch1).toHaveBeenCalledExactlyOnceWith(
                "userCreated",
                event,
            );
            expect(dispatch2).not.toHaveBeenCalled();
        });
        test("Adapter 1:", async () => {
            await container.init();

            const event = { userId: "user-1" };
            await eventBus.use("adapter1").dispatch("userCreated", event);

            expect(dispatch1).toHaveBeenCalledExactlyOnceWith(
                "userCreated",
                event,
            );
            expect(dispatch2).not.toHaveBeenCalled();
        });
        test("Adapter 2:", async () => {
            await container.init();

            const event = { userId: "user-2" };
            await eventBus.use("adapter2").dispatch("userCreated", event);

            expect(dispatch2).toHaveBeenCalledExactlyOnceWith(
                "userCreated",
                event,
            );
            expect(dispatch1).not.toHaveBeenCalled();
        });
        test("Registers listeners before the application starts:", async () => {
            const listener = vi.fn();
            await eventBus.addListener("userCreated", listener);
            await container.init();

            const event1 = { userId: "user-1" };
            await eventBus.use("adapter1").dispatch("userCreated", event1);

            expect(listener).toHaveBeenCalledExactlyOnceWith({
                ...event1,
                type: "userCreated",
            });

            const event2 = { userId: "user-2" };
            await eventBus.use("adapter2").dispatch("userCreated", event2);

            expect(listener).toHaveBeenCalledTimes(2);
            expect(listener).toHaveBeenCalledWith({
                ...event1,
                type: "userCreated",
            });
        });
        test("Throws when registering a listener after the application starts:", async () => {
            await container.init();

            await expect(
                eventBus.addListener("userCreated", () => {}),
            ).rejects.toThrow(InvalidMethodCallDiError);
        });
    });
});
