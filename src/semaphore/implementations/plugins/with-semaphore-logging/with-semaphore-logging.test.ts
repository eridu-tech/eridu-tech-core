import { beforeEach, describe, expect, test, vi } from "vitest";

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

    describe("entry naming", () => {
        test("Should name entries after the adapter class and the method", async () => {
            class TestAdapter extends NoOpSemaphoreAdapter {}
            const adapter = new TestAdapter();
            const logger = new Logger({
                transport: new NoOpLoggerTransport(),
            });
            const debugSpy = vi.spyOn(logger, "debug");
            const enhanced = withPlugin(adapter, withSemaphoreLogging(logger));

            await enhanced.release("myKey", "slotId");

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                "TestAdapter.release succeeded",
                {
                    args: ["myKey", "slotId"],
                    result: true,
                },
            );
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
                "NoOpSemaphoreAdapter.acquire succeeded",
                {
                    args: [settings],
                    result: true,
                },
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
                "NoOpSemaphoreAdapter.acquire failed",
                {
                    args: [settings],
                    error,
                },
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
                "NoOpSemaphoreAdapter.forceReleaseAll succeeded",
                {
                    args: ["myKey"],
                    result: true,
                },
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

            const result = await enhanced.getState("myKey");

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                "NoOpSemaphoreAdapter.getState succeeded",
                {
                    args: ["myKey"],
                    result,
                },
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
                "NoOpSemaphoreAdapter.refresh succeeded",
                {
                    args: ["myKey", "slotId", currentDate],
                    result: true,
                },
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
                "NoOpSemaphoreAdapter.release succeeded",
                {
                    args: ["myKey", "slotId"],
                    result: true,
                },
            );
        });
    });
});
