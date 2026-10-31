import { EventEmitter } from "node:events";

import { describe, test, beforeEach, expect, vi } from "vitest";

import {
    UnableToAddListenerEventBusError,
    UnableToDispatchEventBusError,
} from "@/event-bus/contracts/_module-exports.js";
import { MemoryEventBusAdapter } from "@/event-bus/implementations/adapters/memory-event-bus-adapter/memory-event-bus-adapter.js";
import { NoOpEventBusAdapter } from "@/event-bus/implementations/adapters/no-op-event-bus-adapter/_module-exports.js";
import { EventBus } from "@/event-bus/implementations/derivables/event-bus/event-bus.js";
import { eventBusTestSuite } from "@/event-bus/implementations/test-utilities/_module-exports.js";

describe("class: EventBus", () => {
    let eventEmitter: EventEmitter;
    beforeEach(() => {
        eventEmitter = new EventEmitter();
    });
    eventBusTestSuite({
        test,
        expect,
        describe,
        beforeEach,
        createEventBus: () =>
            new EventBus({
                adapter: new MemoryEventBusAdapter({ eventEmitter }),
            }),
    });
    describe("Unexpected adapter error handling:", () => {
        test("Should reject with UnableToDispatchEventBusError when adapter dispatch fails", async () => {
            const unexpectedError = new Error("Unexpected adapter error");
            const adapter = new NoOpEventBusAdapter();
            vi.spyOn(adapter, "dispatch").mockRejectedValue(unexpectedError);
            const eventBus = new EventBus({ adapter });

            const promise = eventBus.dispatch("my-event", {});

            await expect(promise).rejects.toThrow(
                UnableToDispatchEventBusError,
            );
            await expect(promise).rejects.toHaveProperty(
                "cause",
                unexpectedError,
            );
        });
        test("Should reject with UnableToAddListenerEventBusError when adapter addListener fails", async () => {
            const unexpectedError = new Error("Unexpected adapter error");
            const adapter = new NoOpEventBusAdapter();
            vi.spyOn(adapter, "addListener").mockRejectedValue(unexpectedError);
            const eventBus = new EventBus({ adapter });

            const promise = eventBus.addListener("my-event", () => {});

            await expect(promise).rejects.toThrow(
                UnableToAddListenerEventBusError,
            );
            await expect(promise).rejects.toHaveProperty(
                "cause",
                unexpectedError,
            );
        });
    });
});
