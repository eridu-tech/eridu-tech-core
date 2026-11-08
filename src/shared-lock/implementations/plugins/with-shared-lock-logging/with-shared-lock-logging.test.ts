import { beforeEach, describe, expect, test, vi } from "vitest";

import { Logger } from "@/logger/implementations/derivables/_module-exports.js";
import { NoOpLoggerTransport } from "@/logger/implementations/transports/no-op-logger-transport/_module-exports.js";
import { withPlugin } from "@/middleware/implementations/with-plugin-factory/_module.js";
import { NoOpSharedLockAdapter } from "@/shared-lock/implementations/adapters/no-op-shared-lock-adapter/_module-exports.js";
import { withSharedLockLogging } from "@/shared-lock/implementations/plugins/with-shared-lock-logging/with-shared-lock-logging.js";

import type { SharedLockAcquireSettings } from "@/shared-lock/contracts/_module-exports.js";

describe("function: withSharedLockLogging", () => {
    const currentDate = new Date();

    function createAcquireSettings(): SharedLockAcquireSettings {
        return {
            key: "myKey",
            lockId: "lockId",
            limit: 3,
            ttl: currentDate,
        };
    }

    beforeEach(() => {
        vi.restoreAllMocks();
    });

    describe("entry naming", () => {
        test("Should name entries after the adapter class and the method", async () => {
            class TestAdapter extends NoOpSharedLockAdapter {}
            const adapter = new TestAdapter();
            const logger = new Logger({
                transport: new NoOpLoggerTransport(),
            });
            const debugSpy = vi.spyOn(logger, "debug");
            const enhanced = withPlugin(adapter, withSharedLockLogging(logger));

            await enhanced.releaseWriter("myKey", "lockId");

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                "TestAdapter.releaseWriter succeeded",
                {
                    args: ["myKey", "lockId"],
                    result: true,
                },
            );
        });
    });

    describe("method: acquireReader", () => {
        test("Should log a debug entry when the call succeeds", async () => {
            const adapter = new NoOpSharedLockAdapter();
            const logger = new Logger({
                transport: new NoOpLoggerTransport(),
            });
            const debugSpy = vi.spyOn(logger, "debug");
            const settings = createAcquireSettings();
            const enhanced = withPlugin(adapter, withSharedLockLogging(logger));

            await enhanced.acquireReader(settings);

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                "NoOpSharedLockAdapter.acquireReader succeeded",
                {
                    args: [settings],
                    result: true,
                },
            );
        });
    });

    describe("method: acquireWriter", () => {
        test("Should log a debug entry when the call succeeds", async () => {
            const adapter = new NoOpSharedLockAdapter();
            const logger = new Logger({
                transport: new NoOpLoggerTransport(),
            });
            const debugSpy = vi.spyOn(logger, "debug");
            const enhanced = withPlugin(adapter, withSharedLockLogging(logger));

            await enhanced.acquireWriter("myKey", "lockId", currentDate);

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                "NoOpSharedLockAdapter.acquireWriter succeeded",
                {
                    args: ["myKey", "lockId", currentDate],
                    result: true,
                },
            );
        });

        test("Should log an error entry and rethrow when the call fails", async () => {
            const adapter = new NoOpSharedLockAdapter();
            const logger = new Logger({
                transport: new NoOpLoggerTransport(),
            });
            const debugSpy = vi.spyOn(logger, "debug");
            const errorSpy = vi.spyOn(logger, "error");
            const error = new Error("acquireWriter failed");
            vi.spyOn(adapter, "acquireWriter").mockRejectedValueOnce(error);
            const enhanced = withPlugin(adapter, withSharedLockLogging(logger));

            await expect(
                enhanced.acquireWriter("myKey", "lockId", currentDate),
            ).rejects.toThrow(error);

            expect(debugSpy).not.toHaveBeenCalled();
            expect(errorSpy).toHaveBeenCalledExactlyOnceWith(
                "NoOpSharedLockAdapter.acquireWriter failed",
                {
                    args: ["myKey", "lockId", currentDate],
                    error,
                },
            );
        });
    });

    describe("method: forceRelease", () => {
        test("Should log a debug entry when the call succeeds", async () => {
            const adapter = new NoOpSharedLockAdapter();
            const logger = new Logger({
                transport: new NoOpLoggerTransport(),
            });
            const debugSpy = vi.spyOn(logger, "debug");
            const enhanced = withPlugin(adapter, withSharedLockLogging(logger));

            await enhanced.forceRelease("myKey");

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                "NoOpSharedLockAdapter.forceRelease succeeded",
                {
                    args: ["myKey"],
                    result: true,
                },
            );
        });
    });

    describe("method: getState", () => {
        test("Should log a debug entry when the call succeeds", async () => {
            const adapter = new NoOpSharedLockAdapter();
            const logger = new Logger({
                transport: new NoOpLoggerTransport(),
            });
            const debugSpy = vi.spyOn(logger, "debug");
            const enhanced = withPlugin(adapter, withSharedLockLogging(logger));

            await enhanced.getState("myKey");

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                "NoOpSharedLockAdapter.getState succeeded",
                {
                    args: ["myKey"],
                    result: null,
                },
            );
        });
    });

    describe("method: refreshReader", () => {
        test("Should log a debug entry when the call succeeds", async () => {
            const adapter = new NoOpSharedLockAdapter();
            const logger = new Logger({
                transport: new NoOpLoggerTransport(),
            });
            const debugSpy = vi.spyOn(logger, "debug");
            const enhanced = withPlugin(adapter, withSharedLockLogging(logger));

            await enhanced.refreshReader("myKey", "slotId", currentDate);

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                "NoOpSharedLockAdapter.refreshReader succeeded",
                {
                    args: ["myKey", "slotId", currentDate],
                    result: true,
                },
            );
        });
    });

    describe("method: refreshWriter", () => {
        test("Should log a debug entry when the call succeeds", async () => {
            const adapter = new NoOpSharedLockAdapter();
            const logger = new Logger({
                transport: new NoOpLoggerTransport(),
            });
            const debugSpy = vi.spyOn(logger, "debug");
            const enhanced = withPlugin(adapter, withSharedLockLogging(logger));

            await enhanced.refreshWriter("myKey", "lockId", currentDate);

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                "NoOpSharedLockAdapter.refreshWriter succeeded",
                {
                    args: ["myKey", "lockId", currentDate],
                    result: true,
                },
            );
        });
    });

    describe("method: releaseReader", () => {
        test("Should log a debug entry when the call succeeds", async () => {
            const adapter = new NoOpSharedLockAdapter();
            const logger = new Logger({
                transport: new NoOpLoggerTransport(),
            });
            const debugSpy = vi.spyOn(logger, "debug");
            const enhanced = withPlugin(adapter, withSharedLockLogging(logger));

            await enhanced.releaseReader("myKey", "slotId");

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                "NoOpSharedLockAdapter.releaseReader succeeded",
                {
                    args: ["myKey", "slotId"],
                    result: true,
                },
            );
        });
    });

    describe("method: releaseWriter", () => {
        test("Should log a debug entry when the call succeeds", async () => {
            const adapter = new NoOpSharedLockAdapter();
            const logger = new Logger({
                transport: new NoOpLoggerTransport(),
            });
            const debugSpy = vi.spyOn(logger, "debug");
            const enhanced = withPlugin(adapter, withSharedLockLogging(logger));

            await enhanced.releaseWriter("myKey", "lockId");

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                "NoOpSharedLockAdapter.releaseWriter succeeded",
                {
                    args: ["myKey", "lockId"],
                    result: true,
                },
            );
        });
    });
});
