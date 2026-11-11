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
        test("Should attach the group, the adapter class name, the arguments and the result", async () => {
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
            expect(entry?.messages).toEqual(["release succeeded"]);
            expect(entry?.group).toEqual("[Semaphore]");
            expect(entry?.metadata).toEqual({
                adapter: "TestAdapter",
                key: "myKey",
                slotId: "slotId",
                hasReleased: true,
            });
        });

        test("Should attach the error without metadata when the call fails", async () => {
            class TestAdapter extends NoOpSemaphoreAdapter {}
            const adapter = new TestAdapter();
            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            const transport = new NoOpLoggerTransport();
            const logSpy = vi.spyOn(transport, "log");
            const error = new Error("release failed");
            vi.spyOn(adapter, "release").mockRejectedValueOnce(error);
            const logger = new Logger({ transport, executionContext });
            const enhanced = withPlugin(adapter, withSemaphoreLogging(logger));

            await expect(enhanced.release("myKey", "slotId")).rejects.toThrow(
                error,
            );

            const entry = logSpy.mock.calls[0]?.[0];
            expect(entry?.level).toEqual("error");
            expect(entry?.messages).toEqual(["release failed"]);
            expect(entry?.error).toBe(error);
            expect(entry?.metadata).toBeUndefined();
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
                ["acquire succeeded"],
                {
                    group: "[Semaphore]",
                    metadata: {
                        adapter: "NoOpSemaphoreAdapter",
                        ...settings,
                        hasAcquired: true,
                    },
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
                ["acquire failed"],
                { error },
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
                ["forceReleaseAll succeeded"],
                {
                    group: "[Semaphore]",
                    metadata: {
                        adapter: "NoOpSemaphoreAdapter",
                        key: "myKey",
                        hasForceReleasedAll: true,
                    },
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
            const error = new Error("forceReleaseAll failed");
            vi.spyOn(adapter, "forceReleaseAll").mockRejectedValueOnce(error);
            const enhanced = withPlugin(adapter, withSemaphoreLogging(logger));

            await expect(enhanced.forceReleaseAll("myKey")).rejects.toThrow(
                error,
            );

            expect(debugSpy).not.toHaveBeenCalled();
            expect(errorSpy).toHaveBeenCalledExactlyOnceWith(
                ["forceReleaseAll failed"],
                { error },
            );
        });
    });

    describe("method: getState", () => {
        test("Should log a debug entry with the returned state", async () => {
            const adapter = new NoOpSemaphoreAdapter();
            const logger = new Logger({
                transport: new NoOpLoggerTransport(),
            });
            const debugSpy = vi.spyOn(logger, "debug");
            const enhanced = withPlugin(adapter, withSemaphoreLogging(logger));

            await enhanced.getState("myKey");

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                ["getState succeeded"],
                {
                    group: "[Semaphore]",
                    metadata: {
                        adapter: "NoOpSemaphoreAdapter",
                        key: "myKey",
                        state: {
                            limit: Infinity,
                            acquiredSlots: new Map(),
                        },
                    },
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
            const error = new Error("getState failed");
            vi.spyOn(adapter, "getState").mockRejectedValueOnce(error);
            const enhanced = withPlugin(adapter, withSemaphoreLogging(logger));

            await expect(enhanced.getState("myKey")).rejects.toThrow(error);

            expect(debugSpy).not.toHaveBeenCalled();
            expect(errorSpy).toHaveBeenCalledExactlyOnceWith(
                ["getState failed"],
                { error },
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
                ["refresh succeeded"],
                {
                    group: "[Semaphore]",
                    metadata: {
                        adapter: "NoOpSemaphoreAdapter",
                        key: "myKey",
                        slotId: "slotId",
                        ttl: currentDate,
                        hasRefreshed: true,
                    },
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
            const error = new Error("refresh failed");
            vi.spyOn(adapter, "refresh").mockRejectedValueOnce(error);
            const enhanced = withPlugin(adapter, withSemaphoreLogging(logger));

            await expect(
                enhanced.refresh("myKey", "slotId", currentDate),
            ).rejects.toThrow(error);

            expect(debugSpy).not.toHaveBeenCalled();
            expect(errorSpy).toHaveBeenCalledExactlyOnceWith(
                ["refresh failed"],
                { error },
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
                ["release succeeded"],
                {
                    group: "[Semaphore]",
                    metadata: {
                        adapter: "NoOpSemaphoreAdapter",
                        key: "myKey",
                        slotId: "slotId",
                        hasReleased: true,
                    },
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
            const error = new Error("release failed");
            vi.spyOn(adapter, "release").mockRejectedValueOnce(error);
            const enhanced = withPlugin(adapter, withSemaphoreLogging(logger));

            await expect(enhanced.release("myKey", "slotId")).rejects.toThrow(
                error,
            );

            expect(debugSpy).not.toHaveBeenCalled();
            expect(errorSpy).toHaveBeenCalledExactlyOnceWith(
                ["release failed"],
                { error },
            );
        });
    });
});
