import { beforeEach, describe, expect, test, vi } from "vitest";

import {
    UnableToAddListenerEventBusError,
    UnableToDispatchEventBusError,
    UnableToRemoveListenerEventBusError,
} from "@/event-bus/contracts/_module-exports.js";
import { NoOpEventBusAdapter } from "@/event-bus/implementations/adapters/no-op-event-bus-adapter/_module-exports.js";
import { handleUnexpectedEventBusAdapterError } from "@/event-bus/implementations/derivables/event-bus/handle-unexpected-event-bus-adapter-error.js";
import { enhanceFactory } from "@/middleware/implementations/enhance-factory/_module.js";
import { useFactory } from "@/middleware/implementations/use-factory/_module.js";
import { withPluginFactory } from "@/middleware/implementations/with-plugin-factory/_module.js";

describe("function: handleUnexpectedEventBusAdapterError", () => {
    const adapter = new NoOpEventBusAdapter();
    const withPlugin = withPluginFactory(enhanceFactory(useFactory()));
    const unexpectedError = new Error("Unexpected adapter error");
    const eventName = "my-event";
    const listener = () => {};

    beforeEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
    });

    describe("method: dispatch", () => {
        test("Should return adapter result when adapter succeeds", async () => {
            const enhanced = withPlugin(
                adapter,
                handleUnexpectedEventBusAdapterError(),
            );

            await expect(
                enhanced.dispatch(eventName, { value: 1 }),
            ).resolves.toBeUndefined();
        });
        test("Should throw UnableToDispatchEventBusError when adapter rejects", async () => {
            vi.spyOn(adapter, "dispatch").mockRejectedValue(unexpectedError);
            const enhanced = withPlugin(
                adapter,
                handleUnexpectedEventBusAdapterError(),
            );

            const promise = enhanced.dispatch(eventName, { value: 1 });

            await expect(promise).rejects.toThrow(
                UnableToDispatchEventBusError,
            );
            await expect(promise).rejects.toHaveProperty(
                "cause",
                unexpectedError,
            );
        });
        test("Should throw UnableToDispatchEventBusError when adapter throws synchronously", async () => {
            vi.spyOn(adapter, "dispatch").mockImplementation(() => {
                throw unexpectedError;
            });
            const enhanced = withPlugin(
                adapter,
                handleUnexpectedEventBusAdapterError(),
            );

            const promise = enhanced.dispatch(eventName, { value: 1 });

            await expect(promise).rejects.toThrow(
                UnableToDispatchEventBusError,
            );
            await expect(promise).rejects.toHaveProperty(
                "cause",
                unexpectedError,
            );
        });
    });

    describe("method: addListener", () => {
        test("Should return adapter result when adapter succeeds", async () => {
            const enhanced = withPlugin(
                adapter,
                handleUnexpectedEventBusAdapterError(),
            );

            await expect(
                enhanced.addListener(eventName, listener),
            ).resolves.toBeUndefined();
        });
        test("Should throw UnableToAddListenerEventBusError when adapter rejects", async () => {
            vi.spyOn(adapter, "addListener").mockRejectedValue(unexpectedError);
            const enhanced = withPlugin(
                adapter,
                handleUnexpectedEventBusAdapterError(),
            );

            const promise = enhanced.addListener(eventName, listener);

            await expect(promise).rejects.toThrow(
                UnableToAddListenerEventBusError,
            );
            await expect(promise).rejects.toHaveProperty(
                "cause",
                unexpectedError,
            );
        });
    });

    describe("method: removeListener", () => {
        test("Should return adapter result when adapter succeeds", async () => {
            const enhanced = withPlugin(
                adapter,
                handleUnexpectedEventBusAdapterError(),
            );

            await expect(
                enhanced.removeListener(eventName, listener),
            ).resolves.toBeUndefined();
        });
        test("Should throw UnableToRemoveListenerEventBusError when adapter rejects", async () => {
            vi.spyOn(adapter, "removeListener").mockRejectedValue(
                unexpectedError,
            );
            const enhanced = withPlugin(
                adapter,
                handleUnexpectedEventBusAdapterError(),
            );

            const promise = enhanced.removeListener(eventName, listener);

            await expect(promise).rejects.toThrow(
                UnableToRemoveListenerEventBusError,
            );
            await expect(promise).rejects.toHaveProperty(
                "cause",
                unexpectedError,
            );
        });
    });
});
