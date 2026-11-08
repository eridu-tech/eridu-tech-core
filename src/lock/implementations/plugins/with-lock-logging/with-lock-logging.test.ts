import { beforeEach, describe, expect, test, vi } from "vitest";

import { NoOpLockAdapter } from "@/lock/implementations/adapters/no-op-lock-adapter/_module-exports.js";
import { withLockLogging } from "@/lock/implementations/plugins/with-lock-logging/with-lock-logging.js";
import { Logger } from "@/logger/implementations/derivables/_module-exports.js";
import { NoOpLoggerTransport } from "@/logger/implementations/transports/no-op-logger-transport/_module-exports.js";
import { withPlugin } from "@/middleware/implementations/with-plugin-factory/_module.js";

describe("function: withLockLogging", () => {
    const currentDate = new Date();

    beforeEach(() => {
        vi.restoreAllMocks();
    });

    describe("entry naming", () => {
        test("Should name entries after the adapter class and the method", async () => {
            class TestLockAdapter extends NoOpLockAdapter {}
            const adapter = new TestLockAdapter();
            const logger = new Logger({
                transport: new NoOpLoggerTransport(),
            });
            const debugSpy = vi.spyOn(logger, "debug");
            const enhanced = withPlugin(adapter, withLockLogging(logger));

            await enhanced.release("myKey", "lockId");

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                "TestLockAdapter.release succeeded",
                {
                    args: ["myKey", "lockId"],
                    result: true,
                },
            );
        });
    });

    describe("method: acquire", () => {
        test("Should log a debug entry when the call succeeds", async () => {
            const adapter = new NoOpLockAdapter();
            const logger = new Logger({
                transport: new NoOpLoggerTransport(),
            });
            const debugSpy = vi.spyOn(logger, "debug");
            const enhanced = withPlugin(adapter, withLockLogging(logger));

            await enhanced.acquire("myKey", "lockId", currentDate);

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                "NoOpLockAdapter.acquire succeeded",
                {
                    args: ["myKey", "lockId", currentDate],
                    result: true,
                },
            );
        });

        test("Should log an error entry and rethrow when the call fails", async () => {
            const adapter = new NoOpLockAdapter();
            const logger = new Logger({
                transport: new NoOpLoggerTransport(),
            });
            const debugSpy = vi.spyOn(logger, "debug");
            const errorSpy = vi.spyOn(logger, "error");
            const error = new Error("acquire failed");
            vi.spyOn(adapter, "acquire").mockRejectedValueOnce(error);
            const enhanced = withPlugin(adapter, withLockLogging(logger));

            await expect(
                enhanced.acquire("myKey", "lockId", currentDate),
            ).rejects.toThrow(error);

            expect(debugSpy).not.toHaveBeenCalled();
            expect(errorSpy).toHaveBeenCalledExactlyOnceWith(
                "NoOpLockAdapter.acquire failed",
                {
                    args: ["myKey", "lockId", currentDate],
                    error,
                },
            );
        });
    });

    describe("method: forceRelease", () => {
        test("Should log a debug entry when the call succeeds", async () => {
            const adapter = new NoOpLockAdapter();
            const logger = new Logger({
                transport: new NoOpLoggerTransport(),
            });
            const debugSpy = vi.spyOn(logger, "debug");
            const enhanced = withPlugin(adapter, withLockLogging(logger));

            await enhanced.forceRelease("myKey");

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                "NoOpLockAdapter.forceRelease succeeded",
                {
                    args: ["myKey"],
                    result: true,
                },
            );
        });
    });

    describe("method: getState", () => {
        test("Should log a debug entry when the call succeeds", async () => {
            const adapter = new NoOpLockAdapter();
            const logger = new Logger({
                transport: new NoOpLoggerTransport(),
            });
            const debugSpy = vi.spyOn(logger, "debug");
            const enhanced = withPlugin(adapter, withLockLogging(logger));

            await enhanced.getState("myKey");

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                "NoOpLockAdapter.getState succeeded",
                {
                    args: ["myKey"],
                    result: null,
                },
            );
        });
    });

    describe("method: refresh", () => {
        test("Should log a debug entry when the call succeeds", async () => {
            const adapter = new NoOpLockAdapter();
            const logger = new Logger({
                transport: new NoOpLoggerTransport(),
            });
            const debugSpy = vi.spyOn(logger, "debug");
            const enhanced = withPlugin(adapter, withLockLogging(logger));

            await enhanced.refresh("myKey", "lockId", currentDate);

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                "NoOpLockAdapter.refresh succeeded",
                {
                    args: ["myKey", "lockId", currentDate],
                    result: true,
                },
            );
        });
    });

    describe("method: release", () => {
        test("Should log a debug entry when the call succeeds", async () => {
            const adapter = new NoOpLockAdapter();
            const logger = new Logger({
                transport: new NoOpLoggerTransport(),
            });
            const debugSpy = vi.spyOn(logger, "debug");
            const enhanced = withPlugin(adapter, withLockLogging(logger));

            await enhanced.release("myKey", "lockId");

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                "NoOpLockAdapter.release succeeded",
                {
                    args: ["myKey", "lockId"],
                    result: true,
                },
            );
        });
    });
});
