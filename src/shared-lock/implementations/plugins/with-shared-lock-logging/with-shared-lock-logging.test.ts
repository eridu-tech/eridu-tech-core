import { beforeEach, describe, expect, test, vi } from "vitest";

import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";
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

    describe("entry metadata", () => {
        test("Should attach the adapter class name, the arguments and the result", async () => {
            class TestAdapter extends NoOpSharedLockAdapter {}
            const adapter = new TestAdapter();
            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            const transport = new NoOpLoggerTransport();
            const logSpy = vi.spyOn(transport, "log");
            const logger = new Logger({ transport, executionContext });
            const enhanced = withPlugin(adapter, withSharedLockLogging(logger));

            await enhanced.releaseWriter("myKey", "lockId");

            const entry = logSpy.mock.calls[0]?.[0];
            expect(entry?.messages).toEqual([
                "shared-lock.releaseWriter succeeded",
            ]);
            expect(entry?.metadata).toEqual({
                "shared-lock.adapter": "TestAdapter",
                "shared-lock.args": ["myKey", "lockId"],
                "shared-lock.result": true,
            });
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
                "shared-lock.acquireReader succeeded",
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
                "shared-lock.acquireWriter succeeded",
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
                "shared-lock.acquireWriter failed",
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
                "shared-lock.forceRelease succeeded",
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
                "shared-lock.getState succeeded",
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
                "shared-lock.refreshReader succeeded",
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
                "shared-lock.refreshWriter succeeded",
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
                "shared-lock.releaseReader succeeded",
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
                "shared-lock.releaseWriter succeeded",
            );
        });
    });
});
