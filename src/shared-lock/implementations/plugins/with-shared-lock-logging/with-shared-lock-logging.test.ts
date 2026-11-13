import { beforeEach, describe, expect, test, vi } from "vitest";

import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";
import { Log } from "@/log/implementations/derivables/_module-exports.js";
import { NoOpLogTransport } from "@/log/implementations/transports/no-op-log-transport/_module-exports.js";
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
        test("Should attach the group, the adapter class name, the arguments and the result", async () => {
            class TestAdapter extends NoOpSharedLockAdapter {}
            const adapter = new TestAdapter();
            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            const transport = new NoOpLogTransport();
            const logSpy = vi.spyOn(transport, "log");
            const log = new Log({ transport, executionContext });
            const enhanced = withPlugin(adapter, withSharedLockLogging(log));

            await enhanced.releaseWriter("myKey", "lockId");

            const entry = logSpy.mock.calls[0]?.[0];
            expect(entry?.messages).toEqual(["releaseWriter succeeded"]);
            expect(entry?.group).toEqual("[SharedLock]");
            expect(entry?.metadata).toEqual({
                adapter: "TestAdapter",
                key: "myKey",
                lockId: "lockId",
                hasReleasedWriter: true,
            });
        });

        test("Should attach the error without metadata when the call fails", async () => {
            class TestAdapter extends NoOpSharedLockAdapter {}
            const adapter = new TestAdapter();
            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            const transport = new NoOpLogTransport();
            const logSpy = vi.spyOn(transport, "log");
            const error = new Error("releaseWriter failed");
            vi.spyOn(adapter, "releaseWriter").mockRejectedValueOnce(error);
            const log = new Log({ transport, executionContext });
            const enhanced = withPlugin(adapter, withSharedLockLogging(log));

            await expect(
                enhanced.releaseWriter("myKey", "lockId"),
            ).rejects.toThrow(error);

            const entry = logSpy.mock.calls[0]?.[0];
            expect(entry?.level).toEqual("error");
            expect(entry?.messages).toEqual(["releaseWriter failed"]);
            expect(entry?.error).toBe(error);
            expect(entry?.metadata).toBeUndefined();
        });
    });

    describe("method: acquireReader", () => {
        test("Should log a debug entry when the call succeeds", async () => {
            const adapter = new NoOpSharedLockAdapter();
            const log = new Log({
                transport: new NoOpLogTransport(),
            });
            const debugSpy = vi.spyOn(log, "debug");
            const settings = createAcquireSettings();
            const enhanced = withPlugin(adapter, withSharedLockLogging(log));

            await enhanced.acquireReader(settings);

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                ["acquireReader succeeded"],
                {
                    group: "[SharedLock]",
                    metadata: {
                        adapter: "NoOpSharedLockAdapter",
                        ...settings,
                        hasAcquiredReader: true,
                    },
                },
            );
        });

        test("Should log an error entry and rethrow when the call fails", async () => {
            const adapter = new NoOpSharedLockAdapter();
            const log = new Log({
                transport: new NoOpLogTransport(),
            });
            const debugSpy = vi.spyOn(log, "debug");
            const errorSpy = vi.spyOn(log, "error");
            const settings = createAcquireSettings();
            const error = new Error("acquireReader failed");
            vi.spyOn(adapter, "acquireReader").mockRejectedValueOnce(error);
            const enhanced = withPlugin(adapter, withSharedLockLogging(log));

            await expect(enhanced.acquireReader(settings)).rejects.toThrow(
                error,
            );

            expect(debugSpy).not.toHaveBeenCalled();
            expect(errorSpy).toHaveBeenCalledExactlyOnceWith(
                ["acquireReader failed"],
                { error },
            );
        });
    });

    describe("method: acquireWriter", () => {
        test("Should log a debug entry when the call succeeds", async () => {
            const adapter = new NoOpSharedLockAdapter();
            const log = new Log({
                transport: new NoOpLogTransport(),
            });
            const debugSpy = vi.spyOn(log, "debug");
            const enhanced = withPlugin(adapter, withSharedLockLogging(log));

            await enhanced.acquireWriter("myKey", "lockId", currentDate);

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                ["acquireWriter succeeded"],
                {
                    group: "[SharedLock]",
                    metadata: {
                        adapter: "NoOpSharedLockAdapter",
                        key: "myKey",
                        lockId: "lockId",
                        ttl: currentDate,
                        hasAcquiredWriter: true,
                    },
                },
            );
        });

        test("Should log an error entry and rethrow when the call fails", async () => {
            const adapter = new NoOpSharedLockAdapter();
            const log = new Log({
                transport: new NoOpLogTransport(),
            });
            const debugSpy = vi.spyOn(log, "debug");
            const errorSpy = vi.spyOn(log, "error");
            const error = new Error("acquireWriter failed");
            vi.spyOn(adapter, "acquireWriter").mockRejectedValueOnce(error);
            const enhanced = withPlugin(adapter, withSharedLockLogging(log));

            await expect(
                enhanced.acquireWriter("myKey", "lockId", currentDate),
            ).rejects.toThrow(error);

            expect(debugSpy).not.toHaveBeenCalled();
            expect(errorSpy).toHaveBeenCalledExactlyOnceWith(
                ["acquireWriter failed"],
                { error },
            );
        });
    });

    describe("method: forceRelease", () => {
        test("Should log a debug entry when the call succeeds", async () => {
            const adapter = new NoOpSharedLockAdapter();
            const log = new Log({
                transport: new NoOpLogTransport(),
            });
            const debugSpy = vi.spyOn(log, "debug");
            const enhanced = withPlugin(adapter, withSharedLockLogging(log));

            await enhanced.forceRelease("myKey");

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                ["forceRelease succeeded"],
                {
                    group: "[SharedLock]",
                    metadata: {
                        adapter: "NoOpSharedLockAdapter",
                        key: "myKey",
                        hasForceReleased: true,
                    },
                },
            );
        });

        test("Should log an error entry and rethrow when the call fails", async () => {
            const adapter = new NoOpSharedLockAdapter();
            const log = new Log({
                transport: new NoOpLogTransport(),
            });
            const debugSpy = vi.spyOn(log, "debug");
            const errorSpy = vi.spyOn(log, "error");
            const error = new Error("forceRelease failed");
            vi.spyOn(adapter, "forceRelease").mockRejectedValueOnce(error);
            const enhanced = withPlugin(adapter, withSharedLockLogging(log));

            await expect(enhanced.forceRelease("myKey")).rejects.toThrow(error);

            expect(debugSpy).not.toHaveBeenCalled();
            expect(errorSpy).toHaveBeenCalledExactlyOnceWith(
                ["forceRelease failed"],
                { error },
            );
        });
    });

    describe("method: getState", () => {
        test("Should log a debug entry with the returned state", async () => {
            const adapter = new NoOpSharedLockAdapter();
            const log = new Log({
                transport: new NoOpLogTransport(),
            });
            const debugSpy = vi.spyOn(log, "debug");
            const enhanced = withPlugin(adapter, withSharedLockLogging(log));

            await enhanced.getState("myKey");

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                ["getState succeeded"],
                {
                    group: "[SharedLock]",
                    metadata: {
                        adapter: "NoOpSharedLockAdapter",
                        key: "myKey",
                        state: null,
                    },
                },
            );
        });

        test("Should log an error entry and rethrow when the call fails", async () => {
            const adapter = new NoOpSharedLockAdapter();
            const log = new Log({
                transport: new NoOpLogTransport(),
            });
            const debugSpy = vi.spyOn(log, "debug");
            const errorSpy = vi.spyOn(log, "error");
            const error = new Error("getState failed");
            vi.spyOn(adapter, "getState").mockRejectedValueOnce(error);
            const enhanced = withPlugin(adapter, withSharedLockLogging(log));

            await expect(enhanced.getState("myKey")).rejects.toThrow(error);

            expect(debugSpy).not.toHaveBeenCalled();
            expect(errorSpy).toHaveBeenCalledExactlyOnceWith(
                ["getState failed"],
                { error },
            );
        });
    });

    describe("method: refreshReader", () => {
        test("Should log a debug entry when the call succeeds", async () => {
            const adapter = new NoOpSharedLockAdapter();
            const log = new Log({
                transport: new NoOpLogTransport(),
            });
            const debugSpy = vi.spyOn(log, "debug");
            const enhanced = withPlugin(adapter, withSharedLockLogging(log));

            await enhanced.refreshReader("myKey", "slotId", currentDate);

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                ["refreshReader succeeded"],
                {
                    group: "[SharedLock]",
                    metadata: {
                        adapter: "NoOpSharedLockAdapter",
                        key: "myKey",
                        slotId: "slotId",
                        ttl: currentDate,
                        hasRefreshedReader: true,
                    },
                },
            );
        });

        test("Should log an error entry and rethrow when the call fails", async () => {
            const adapter = new NoOpSharedLockAdapter();
            const log = new Log({
                transport: new NoOpLogTransport(),
            });
            const debugSpy = vi.spyOn(log, "debug");
            const errorSpy = vi.spyOn(log, "error");
            const error = new Error("refreshReader failed");
            vi.spyOn(adapter, "refreshReader").mockRejectedValueOnce(error);
            const enhanced = withPlugin(adapter, withSharedLockLogging(log));

            await expect(
                enhanced.refreshReader("myKey", "slotId", currentDate),
            ).rejects.toThrow(error);

            expect(debugSpy).not.toHaveBeenCalled();
            expect(errorSpy).toHaveBeenCalledExactlyOnceWith(
                ["refreshReader failed"],
                { error },
            );
        });
    });

    describe("method: refreshWriter", () => {
        test("Should log a debug entry when the call succeeds", async () => {
            const adapter = new NoOpSharedLockAdapter();
            const log = new Log({
                transport: new NoOpLogTransport(),
            });
            const debugSpy = vi.spyOn(log, "debug");
            const enhanced = withPlugin(adapter, withSharedLockLogging(log));

            await enhanced.refreshWriter("myKey", "lockId", currentDate);

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                ["refreshWriter succeeded"],
                {
                    group: "[SharedLock]",
                    metadata: {
                        adapter: "NoOpSharedLockAdapter",
                        key: "myKey",
                        lockId: "lockId",
                        ttl: currentDate,
                        hasRefreshedWriter: true,
                    },
                },
            );
        });

        test("Should log an error entry and rethrow when the call fails", async () => {
            const adapter = new NoOpSharedLockAdapter();
            const log = new Log({
                transport: new NoOpLogTransport(),
            });
            const debugSpy = vi.spyOn(log, "debug");
            const errorSpy = vi.spyOn(log, "error");
            const error = new Error("refreshWriter failed");
            vi.spyOn(adapter, "refreshWriter").mockRejectedValueOnce(error);
            const enhanced = withPlugin(adapter, withSharedLockLogging(log));

            await expect(
                enhanced.refreshWriter("myKey", "lockId", currentDate),
            ).rejects.toThrow(error);

            expect(debugSpy).not.toHaveBeenCalled();
            expect(errorSpy).toHaveBeenCalledExactlyOnceWith(
                ["refreshWriter failed"],
                { error },
            );
        });
    });

    describe("method: releaseReader", () => {
        test("Should log a debug entry when the call succeeds", async () => {
            const adapter = new NoOpSharedLockAdapter();
            const log = new Log({
                transport: new NoOpLogTransport(),
            });
            const debugSpy = vi.spyOn(log, "debug");
            const enhanced = withPlugin(adapter, withSharedLockLogging(log));

            await enhanced.releaseReader("myKey", "slotId");

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                ["releaseReader succeeded"],
                {
                    group: "[SharedLock]",
                    metadata: {
                        adapter: "NoOpSharedLockAdapter",
                        key: "myKey",
                        slotId: "slotId",
                        hasReleasedReader: true,
                    },
                },
            );
        });

        test("Should log an error entry and rethrow when the call fails", async () => {
            const adapter = new NoOpSharedLockAdapter();
            const log = new Log({
                transport: new NoOpLogTransport(),
            });
            const debugSpy = vi.spyOn(log, "debug");
            const errorSpy = vi.spyOn(log, "error");
            const error = new Error("releaseReader failed");
            vi.spyOn(adapter, "releaseReader").mockRejectedValueOnce(error);
            const enhanced = withPlugin(adapter, withSharedLockLogging(log));

            await expect(
                enhanced.releaseReader("myKey", "slotId"),
            ).rejects.toThrow(error);

            expect(debugSpy).not.toHaveBeenCalled();
            expect(errorSpy).toHaveBeenCalledExactlyOnceWith(
                ["releaseReader failed"],
                { error },
            );
        });
    });

    describe("method: releaseWriter", () => {
        test("Should log a debug entry when the call succeeds", async () => {
            const adapter = new NoOpSharedLockAdapter();
            const log = new Log({
                transport: new NoOpLogTransport(),
            });
            const debugSpy = vi.spyOn(log, "debug");
            const enhanced = withPlugin(adapter, withSharedLockLogging(log));

            await enhanced.releaseWriter("myKey", "lockId");

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                ["releaseWriter succeeded"],
                {
                    group: "[SharedLock]",
                    metadata: {
                        adapter: "NoOpSharedLockAdapter",
                        key: "myKey",
                        lockId: "lockId",
                        hasReleasedWriter: true,
                    },
                },
            );
        });

        test("Should log an error entry and rethrow when the call fails", async () => {
            const adapter = new NoOpSharedLockAdapter();
            const log = new Log({
                transport: new NoOpLogTransport(),
            });
            const debugSpy = vi.spyOn(log, "debug");
            const errorSpy = vi.spyOn(log, "error");
            const error = new Error("releaseWriter failed");
            vi.spyOn(adapter, "releaseWriter").mockRejectedValueOnce(error);
            const enhanced = withPlugin(adapter, withSharedLockLogging(log));

            await expect(
                enhanced.releaseWriter("myKey", "lockId"),
            ).rejects.toThrow(error);

            expect(debugSpy).not.toHaveBeenCalled();
            expect(errorSpy).toHaveBeenCalledExactlyOnceWith(
                ["releaseWriter failed"],
                { error },
            );
        });
    });
});
