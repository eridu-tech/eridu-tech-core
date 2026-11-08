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
        test("Should attach the adapter class name, the arguments and the result", async () => {
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
            expect(entry?.messages).toEqual(["eventBus.dispatch succeeded"]);
            expect(entry?.metadata).toEqual({
                "eventBus.adapter": "TestAdapter",
                "eventBus.args": ["myEvent", { id: 1 }],
                "eventBus.result": undefined,
            });
        });
    });

    describe("method: addListener", () => {
        test("Should log a debug entry with the event name but without the listener", async () => {
            const adapter = new NoOpEventBusAdapter();
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
            expect(entry?.messages).toEqual(["eventBus.addListener succeeded"]);
            expect(entry?.metadata["eventBus.args"]).toEqual(["myEvent"]);
        });
    });

    describe("method: dispatch", () => {
        test("Should log a debug entry when the call succeeds", async () => {
            const adapter = new NoOpEventBusAdapter();
            const logger = new Logger({
                transport: new NoOpLoggerTransport(),
            });
            const debugSpy = vi.spyOn(logger, "debug");
            const enhanced = withPlugin(adapter, withEventBusLogging(logger));

            await enhanced.dispatch("myEvent", { id: 1 });

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                "eventBus.dispatch succeeded",
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
                "eventBus.dispatch failed",
            );
        });
    });

    describe("method: removeListener", () => {
        test("Should log a debug entry with the event name but without the listener", async () => {
            const adapter = new NoOpEventBusAdapter();
            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            const transport = new NoOpLoggerTransport();
            const logSpy = vi.spyOn(transport, "log");
            const listener: EventListenerFn<Record<string, unknown>> = vi.fn();
            const logger = new Logger({ transport, executionContext });
            const enhanced = withPlugin(adapter, withEventBusLogging(logger));

            await enhanced.removeListener("myEvent", listener);

            const entry = logSpy.mock.calls[0]?.[0];
            expect(entry?.messages).toEqual([
                "eventBus.removeListener succeeded",
            ]);
            expect(entry?.metadata["eventBus.args"]).toEqual(["myEvent"]);
        });
    });
});
