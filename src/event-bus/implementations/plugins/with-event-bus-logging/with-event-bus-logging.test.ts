import { beforeEach, describe, expect, test, vi } from "vitest";

import { NoOpEventBusAdapter } from "@/event-bus/implementations/adapters/no-op-event-bus-adapter/_module-exports.js";
import { withEventBusLogging } from "@/event-bus/implementations/plugins/with-event-bus-logging/with-event-bus-logging.js";
import { Logger } from "@/logger/implementations/derivables/_module-exports.js";
import { NoOpLoggerTransport } from "@/logger/implementations/transports/no-op-logger-transport/_module-exports.js";
import { withPlugin } from "@/middleware/implementations/with-plugin-factory/_module.js";

import type { EventListenerFn } from "@/event-bus/contracts/_module-exports.js";

describe("function: withEventBusLogging", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    describe("entry naming", () => {
        test("Should name entries after the adapter class and the method", async () => {
            class TestAdapter extends NoOpEventBusAdapter {}
            const adapter = new TestAdapter();
            const logger = new Logger({
                transport: new NoOpLoggerTransport(),
            });
            const debugSpy = vi.spyOn(logger, "debug");
            const enhanced = withPlugin(adapter, withEventBusLogging(logger));

            await enhanced.dispatch("myEvent", { id: 1 });

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                "TestAdapter.dispatch succeeded",
                {
                    args: ["myEvent", { id: 1 }],
                    result: undefined,
                },
            );
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
                "NoOpEventBusAdapter.addListener succeeded",
                {
                    args: ["myEvent"],
                    result: undefined,
                },
            );
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
                "NoOpEventBusAdapter.dispatch succeeded",
                {
                    args: ["myEvent", { id: 1 }],
                    result: undefined,
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
                "NoOpEventBusAdapter.dispatch failed",
                {
                    args: ["myEvent", { id: 1 }],
                    error,
                },
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
                "NoOpEventBusAdapter.removeListener succeeded",
                {
                    args: ["myEvent"],
                    result: undefined,
                },
            );
        });
    });
});
