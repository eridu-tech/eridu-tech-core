import { beforeEach, describe, expect, test, vi } from "vitest";

import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";
import { Logger } from "@/logger/implementations/derivables/_module-exports.js";
import { NoOpLoggerTransport } from "@/logger/implementations/transports/no-op-logger-transport/_module-exports.js";
import { withPlugin } from "@/middleware/implementations/with-plugin-factory/_module.js";
import { NoOpSemaphoreAdapter } from "@/semaphore/implementations/adapters/no-op-semaphore-adapter/_module-exports.js";
import { withSemaphoreLogging } from "@/semaphore/implementations/plugins/with-semaphore-logging/with-semaphore-logging.js";

import type { SemaphoreAcquireSettings } from "@/semaphore/contracts/_module-exports.js";

describe("function: withSemaphoreLogging", () => {
    const currentDate = new Date();

    function createAcquireSettings(): SemaphoreAcquireSettings {
        return {
            key: "myKey",
            slotId: "slotId",
            limit: 3,
            ttl: currentDate,
        };
    }

    beforeEach(() => {
        vi.restoreAllMocks();
    });

    describe("entry metadata", () => {
        test("Should attach the adapter class name, the arguments and the result", async () => {
            class TestAdapter extends NoOpSemaphoreAdapter {}
            const adapter = new TestAdapter();
            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            const transport = new NoOpLoggerTransport();
            const logSpy = vi.spyOn(transport, "log");
            const logger = new Logger({ transport, executionContext });
            const enhanced = withPlugin(adapter, withSemaphoreLogging(logger));

            await enhanced.release("myKey", "slotId");

            const entry = logSpy.mock.calls[0]?.[0];
            expect(entry?.messages).toEqual(["semaphore.release succeeded"]);
            expect(entry?.metadata).toEqual({
                "semaphore.adapter": "TestAdapter",
                "semaphore.args": ["myKey", "slotId"],
                "semaphore.result": true,
            });
        });
    });

    describe("method: acquire", () => {
        test("Should log a debug entry when the call succeeds", async () => {
            const adapter = new NoOpSemaphoreAdapter();
            const logger = new Logger({
                transport: new NoOpLoggerTransport(),
            });
            const debugSpy = vi.spyOn(logger, "debug");
            const settings = createAcquireSettings();
            const enhanced = withPlugin(adapter, withSemaphoreLogging(logger));

            await enhanced.acquire(settings);

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                "semaphore.acquire succeeded",
            );
        });

        test("Should log an error entry and rethrow when the call fails", async () => {
            const adapter = new NoOpSemaphoreAdapter();
            const logger = new Logger({
                transport: new NoOpLoggerTransport(),
            });
            const debugSpy = vi.spyOn(logger, "debug");
            const errorSpy = vi.spyOn(logger, "error");
            const settings = createAcquireSettings();
            const error = new Error("acquire failed");
            vi.spyOn(adapter, "acquire").mockRejectedValueOnce(error);
            const enhanced = withPlugin(adapter, withSemaphoreLogging(logger));

            await expect(enhanced.acquire(settings)).rejects.toThrow(error);

            expect(debugSpy).not.toHaveBeenCalled();
            expect(errorSpy).toHaveBeenCalledExactlyOnceWith(
                "semaphore.acquire failed",
            );
        });
    });

    describe("method: forceReleaseAll", () => {
        test("Should log a debug entry when the call succeeds", async () => {
            const adapter = new NoOpSemaphoreAdapter();
            const logger = new Logger({
                transport: new NoOpLoggerTransport(),
            });
            const debugSpy = vi.spyOn(logger, "debug");
            const enhanced = withPlugin(adapter, withSemaphoreLogging(logger));

            await enhanced.forceReleaseAll("myKey");

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                "semaphore.forceReleaseAll succeeded",
            );
        });
    });

    describe("method: getState", () => {
        test("Should log a debug entry when the call succeeds", async () => {
            const adapter = new NoOpSemaphoreAdapter();
            const logger = new Logger({
                transport: new NoOpLoggerTransport(),
            });
            const debugSpy = vi.spyOn(logger, "debug");
            const enhanced = withPlugin(adapter, withSemaphoreLogging(logger));

            await enhanced.getState("myKey");

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                "semaphore.getState succeeded",
            );
        });
    });

    describe("method: refresh", () => {
        test("Should log a debug entry when the call succeeds", async () => {
            const adapter = new NoOpSemaphoreAdapter();
            const logger = new Logger({
                transport: new NoOpLoggerTransport(),
            });
            const debugSpy = vi.spyOn(logger, "debug");
            const enhanced = withPlugin(adapter, withSemaphoreLogging(logger));

            await enhanced.refresh("myKey", "slotId", currentDate);

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                "semaphore.refresh succeeded",
            );
        });
    });

    describe("method: release", () => {
        test("Should log a debug entry when the call succeeds", async () => {
            const adapter = new NoOpSemaphoreAdapter();
            const logger = new Logger({
                transport: new NoOpLoggerTransport(),
            });
            const debugSpy = vi.spyOn(logger, "debug");
            const enhanced = withPlugin(adapter, withSemaphoreLogging(logger));

            await enhanced.release("myKey", "slotId");

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                "semaphore.release succeeded",
            );
        });
    });
});
