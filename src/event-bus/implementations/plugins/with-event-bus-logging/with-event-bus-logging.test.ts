import { beforeEach, describe, expect, test, vi } from "vitest";

import { NoOpEventBusAdapter } from "@/event-bus/implementations/adapters/no-op-event-bus-adapter/_module-exports.js";
import { withEventBusLogging } from "@/event-bus/implementations/plugins/with-event-bus-logging/with-event-bus-logging.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";
import { Logger } from "@/logger/implementations/derivables/_module-exports.js";
import { NoOpLoggerTransport } from "@/logger/implementations/transports/no-op-logger-transport/_module-exports.js";
import { withPlugin } from "@/middleware/implementations/with-plugin-factory/_module.js";

import type { EventListenerFn } from "@/event-bus/contracts/_module-exports.js";

describe("function: withEventBusLogging", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    describe("entry metadata", () => {
        test("Should attach the group, the adapter class name and the event name", async () => {
            class TestAdapter extends NoOpEventBusAdapter {}
            const adapter = new TestAdapter();
            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            const transport = new NoOpLoggerTransport();
            const logSpy = vi.spyOn(transport, "log");
            const listener: EventListenerFn<Record<string, unknown>> = vi.fn();
            const logger = new Logger({ transport, executionContext });
            const enhanced = withPlugin(adapter, withEventBusLogging(logger));

            await enhanced.addListener("myEvent", listener);

            const entry = logSpy.mock.calls[0]?.[0];
            expect(entry?.messages).toEqual(["addListener succeeded"]);
            expect(entry?.group).toEqual("[EventBus]");
            expect(entry?.metadata).toEqual({
                adapter: "TestAdapter",
                eventName: "myEvent",
            });
        });

        test("Should attach the event data for dispatch", async () => {
            class TestAdapter extends NoOpEventBusAdapter {}
            const adapter = new TestAdapter();
            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            const transport = new NoOpLoggerTransport();
            const logSpy = vi.spyOn(transport, "log");
            const logger = new Logger({ transport, executionContext });
            const enhanced = withPlugin(adapter, withEventBusLogging(logger));

            await enhanced.dispatch("myEvent", { id: 1 });

            const entry = logSpy.mock.calls[0]?.[0];
            expect(entry?.messages).toEqual(["dispatch succeeded"]);
            expect(entry?.group).toEqual("[EventBus]");
            expect(entry?.metadata).toEqual({
                adapter: "TestAdapter",
                eventName: "myEvent",
                event: { id: 1 },
            });
        });

        test("Should attach the error without metadata when the call fails", async () => {
            class TestAdapter extends NoOpEventBusAdapter {}
            const adapter = new TestAdapter();
            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            const transport = new NoOpLoggerTransport();
            const logSpy = vi.spyOn(transport, "log");
            const error = new Error("dispatch failed");
            vi.spyOn(adapter, "dispatch").mockRejectedValueOnce(error);
            const logger = new Logger({ transport, executionContext });
            const enhanced = withPlugin(adapter, withEventBusLogging(logger));

            await expect(
                enhanced.dispatch("myEvent", { id: 1 }),
            ).rejects.toThrow(error);

            const entry = logSpy.mock.calls[0]?.[0];
            expect(entry?.level).toEqual("error");
            expect(entry?.messages).toEqual(["dispatch failed"]);
            expect(entry?.error).toBe(error);
            expect(entry?.metadata).toBeUndefined();
        });
    });

    describe("method: addListener", () => {
        test("Should log a debug entry with the event name but without the listener", async () => {
            const adapter = new NoOpEventBusAdapter();
            const logger = new Logger({
                transport: new NoOpLoggerTransport(),
            });
            const debugSpy = vi.spyOn(logger, "debug");
            const listener: EventListenerFn<Record<string, unknown>> = vi.fn();
            const enhanced = withPlugin(adapter, withEventBusLogging(logger));

            await enhanced.addListener("myEvent", listener);

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                ["addListener succeeded"],
                {
                    group: "[EventBus]",
                    metadata: {
                        adapter: "NoOpEventBusAdapter",
                        eventName: "myEvent",
                    },
                },
            );
        });

        test("Should log an error entry and rethrow when the call fails", async () => {
            const adapter = new NoOpEventBusAdapter();
            const logger = new Logger({
                transport: new NoOpLoggerTransport(),
            });
            const debugSpy = vi.spyOn(logger, "debug");
            const errorSpy = vi.spyOn(logger, "error");
            const listener: EventListenerFn<Record<string, unknown>> = vi.fn();
            const error = new Error("addListener failed");
            vi.spyOn(adapter, "addListener").mockRejectedValueOnce(error);
            const enhanced = withPlugin(adapter, withEventBusLogging(logger));

            await expect(
                enhanced.addListener("myEvent", listener),
            ).rejects.toThrow(error);

            expect(debugSpy).not.toHaveBeenCalled();
            expect(errorSpy).toHaveBeenCalledExactlyOnceWith(
                ["addListener failed"],
                { error },
            );
        });
    });

    describe("method: dispatch", () => {
        test("Should log a debug entry with the event data", async () => {
            const adapter = new NoOpEventBusAdapter();
            const logger = new Logger({
                transport: new NoOpLoggerTransport(),
            });
            const debugSpy = vi.spyOn(logger, "debug");
            const enhanced = withPlugin(adapter, withEventBusLogging(logger));

            await enhanced.dispatch("myEvent", { id: 1 });

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                ["dispatch succeeded"],
                {
                    group: "[EventBus]",
                    metadata: {
                        adapter: "NoOpEventBusAdapter",
                        eventName: "myEvent",
                        event: { id: 1 },
                    },
                },
            );
        });

        test("Should log an error entry and rethrow when the call fails", async () => {
            const adapter = new NoOpEventBusAdapter();
            const logger = new Logger({
                transport: new NoOpLoggerTransport(),
            });
            const debugSpy = vi.spyOn(logger, "debug");
            const errorSpy = vi.spyOn(logger, "error");
            const error = new Error("dispatch failed");
            vi.spyOn(adapter, "dispatch").mockRejectedValueOnce(error);
            const enhanced = withPlugin(adapter, withEventBusLogging(logger));

            await expect(
                enhanced.dispatch("myEvent", { id: 1 }),
            ).rejects.toThrow(error);

            expect(debugSpy).not.toHaveBeenCalled();
            expect(errorSpy).toHaveBeenCalledExactlyOnceWith(
                ["dispatch failed"],
                { error },
            );
        });
    });

    describe("method: removeListener", () => {
        test("Should log a debug entry with the event name but without the listener", async () => {
            const adapter = new NoOpEventBusAdapter();
            const logger = new Logger({
                transport: new NoOpLoggerTransport(),
            });
            const debugSpy = vi.spyOn(logger, "debug");
            const listener: EventListenerFn<Record<string, unknown>> = vi.fn();
            const enhanced = withPlugin(adapter, withEventBusLogging(logger));

            await enhanced.removeListener("myEvent", listener);

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                ["removeListener succeeded"],
                {
                    group: "[EventBus]",
                    metadata: {
                        adapter: "NoOpEventBusAdapter",
                        eventName: "myEvent",
                    },
                },
            );
        });

        test("Should log an error entry and rethrow when the call fails", async () => {
            const adapter = new NoOpEventBusAdapter();
            const logger = new Logger({
                transport: new NoOpLoggerTransport(),
            });
            const debugSpy = vi.spyOn(logger, "debug");
            const errorSpy = vi.spyOn(logger, "error");
            const listener: EventListenerFn<Record<string, unknown>> = vi.fn();
            const error = new Error("removeListener failed");
            vi.spyOn(adapter, "removeListener").mockRejectedValueOnce(error);
            const enhanced = withPlugin(adapter, withEventBusLogging(logger));

            await expect(
                enhanced.removeListener("myEvent", listener),
            ).rejects.toThrow(error);

            expect(debugSpy).not.toHaveBeenCalled();
            expect(errorSpy).toHaveBeenCalledExactlyOnceWith(
                ["removeListener failed"],
                { error },
            );
        });
    });
});
