import { beforeEach, describe, expect, test, vi } from "vitest";

import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";
import { NoOpLockAdapter } from "@/lock/implementations/adapters/no-op-lock-adapter/_module-exports.js";
import { withLockLogging } from "@/lock/implementations/plugins/with-lock-logging/with-lock-logging.js";
import { Log } from "@/log/implementations/derivables/_module-exports.js";
import { NoOpLogTransport } from "@/log/implementations/transports/no-op-log-transport/_module-exports.js";
import { withPlugin } from "@/middleware/implementations/with-plugin-factory/_module.js";

describe("function: withLockLogging", () => {
    const currentDate = new Date();

    beforeEach(() => {
        vi.restoreAllMocks();
    });

    describe("entry metadata", () => {
        test("Should attach the group, the adapter class name, the arguments and the result", async () => {
            class TestLockAdapter extends NoOpLockAdapter {}
            const adapter = new TestLockAdapter();
            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            const transport = new NoOpLogTransport();
            const logSpy = vi.spyOn(transport, "log");
            const log = new Log({ transport, executionContext });
            const enhanced = withPlugin(adapter, withLockLogging(log));

            await enhanced.acquire("myKey", "lockId", currentDate);

            const entry = logSpy.mock.calls[0]?.[0];
            expect(entry?.messages).toEqual(["acquire succeeded"]);
            expect(entry?.group).toEqual("[Lock]");
            expect(entry?.metadata).toEqual({
                adapter: "TestLockAdapter",
                key: "myKey",
                lockId: "lockId",
                ttl: currentDate,
                hasAcquired: true,
            });
        });

        test("Should attach the error without metadata when the call fails", async () => {
            class TestLockAdapter extends NoOpLockAdapter {}
            const adapter = new TestLockAdapter();
            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            const transport = new NoOpLogTransport();
            const logSpy = vi.spyOn(transport, "log");
            const error = new Error("acquire failed");
            vi.spyOn(adapter, "acquire").mockRejectedValueOnce(error);
            const log = new Log({ transport, executionContext });
            const enhanced = withPlugin(adapter, withLockLogging(log));

            await expect(
                enhanced.acquire("myKey", "lockId", currentDate),
            ).rejects.toThrow(error);

            const entry = logSpy.mock.calls[0]?.[0];
            expect(entry?.level).toEqual("error");
            expect(entry?.messages).toEqual(["acquire failed"]);
            expect(entry?.error).toBe(error);
            expect(entry?.metadata).toBeUndefined();
        });
    });

    describe("method: acquire", () => {
        test("Should log a debug entry when the call succeeds", async () => {
            const adapter = new NoOpLockAdapter();
            const log = new Log({
                transport: new NoOpLogTransport(),
            });
            const debugSpy = vi.spyOn(log, "debug");
            const enhanced = withPlugin(adapter, withLockLogging(log));

            await enhanced.acquire("myKey", "lockId", currentDate);

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                ["acquire succeeded"],
                {
                    group: "[Lock]",
                    metadata: {
                        adapter: "NoOpLockAdapter",
                        key: "myKey",
                        lockId: "lockId",
                        ttl: currentDate,
                        hasAcquired: true,
                    },
                },
            );
        });

        test("Should log an error entry and rethrow when the call fails", async () => {
            const adapter = new NoOpLockAdapter();
            const log = new Log({
                transport: new NoOpLogTransport(),
            });
            const debugSpy = vi.spyOn(log, "debug");
            const errorSpy = vi.spyOn(log, "error");
            const error = new Error("acquire failed");
            vi.spyOn(adapter, "acquire").mockRejectedValueOnce(error);
            const enhanced = withPlugin(adapter, withLockLogging(log));

            await expect(
                enhanced.acquire("myKey", "lockId", currentDate),
            ).rejects.toThrow(error);

            expect(debugSpy).not.toHaveBeenCalled();
            expect(errorSpy).toHaveBeenCalledExactlyOnceWith(
                ["acquire failed"],
                { error },
            );
        });
    });

    describe("method: forceRelease", () => {
        test("Should log a debug entry when the call succeeds", async () => {
            const adapter = new NoOpLockAdapter();
            const log = new Log({
                transport: new NoOpLogTransport(),
            });
            const debugSpy = vi.spyOn(log, "debug");
            const enhanced = withPlugin(adapter, withLockLogging(log));

            await enhanced.forceRelease("myKey");

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                ["forceRelease succeeded"],
                {
                    group: "[Lock]",
                    metadata: {
                        adapter: "NoOpLockAdapter",
                        key: "myKey",
                        hasForceReleased: true,
                    },
                },
            );
        });

        test("Should log an error entry and rethrow when the call fails", async () => {
            const adapter = new NoOpLockAdapter();
            const log = new Log({
                transport: new NoOpLogTransport(),
            });
            const debugSpy = vi.spyOn(log, "debug");
            const errorSpy = vi.spyOn(log, "error");
            const error = new Error("forceRelease failed");
            vi.spyOn(adapter, "forceRelease").mockRejectedValueOnce(error);
            const enhanced = withPlugin(adapter, withLockLogging(log));

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
            const adapter = new NoOpLockAdapter();
            const log = new Log({
                transport: new NoOpLogTransport(),
            });
            const debugSpy = vi.spyOn(log, "debug");
            const enhanced = withPlugin(adapter, withLockLogging(log));

            await enhanced.getState("myKey");

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                ["getState succeeded"],
                {
                    group: "[Lock]",
                    metadata: {
                        adapter: "NoOpLockAdapter",
                        key: "myKey",
                        state: null,
                    },
                },
            );
        });

        test("Should log an error entry and rethrow when the call fails", async () => {
            const adapter = new NoOpLockAdapter();
            const log = new Log({
                transport: new NoOpLogTransport(),
            });
            const debugSpy = vi.spyOn(log, "debug");
            const errorSpy = vi.spyOn(log, "error");
            const error = new Error("getState failed");
            vi.spyOn(adapter, "getState").mockRejectedValueOnce(error);
            const enhanced = withPlugin(adapter, withLockLogging(log));

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
            const adapter = new NoOpLockAdapter();
            const log = new Log({
                transport: new NoOpLogTransport(),
            });
            const debugSpy = vi.spyOn(log, "debug");
            const enhanced = withPlugin(adapter, withLockLogging(log));

            await enhanced.refresh("myKey", "lockId", currentDate);

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                ["refresh succeeded"],
                {
                    group: "[Lock]",
                    metadata: {
                        adapter: "NoOpLockAdapter",
                        key: "myKey",
                        lockId: "lockId",
                        ttl: currentDate,
                        hasRefreshed: true,
                    },
                },
            );
        });

        test("Should log an error entry and rethrow when the call fails", async () => {
            const adapter = new NoOpLockAdapter();
            const log = new Log({
                transport: new NoOpLogTransport(),
            });
            const debugSpy = vi.spyOn(log, "debug");
            const errorSpy = vi.spyOn(log, "error");
            const error = new Error("refresh failed");
            vi.spyOn(adapter, "refresh").mockRejectedValueOnce(error);
            const enhanced = withPlugin(adapter, withLockLogging(log));

            await expect(
                enhanced.refresh("myKey", "lockId", currentDate),
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
            const adapter = new NoOpLockAdapter();
            const log = new Log({
                transport: new NoOpLogTransport(),
            });
            const debugSpy = vi.spyOn(log, "debug");
            const enhanced = withPlugin(adapter, withLockLogging(log));

            await enhanced.release("myKey", "lockId");

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                ["release succeeded"],
                {
                    group: "[Lock]",
                    metadata: {
                        adapter: "NoOpLockAdapter",
                        key: "myKey",
                        lockId: "lockId",
                        hasReleased: true,
                    },
                },
            );
        });

        test("Should log an error entry and rethrow when the call fails", async () => {
            const adapter = new NoOpLockAdapter();
            const log = new Log({
                transport: new NoOpLogTransport(),
            });
            const debugSpy = vi.spyOn(log, "debug");
            const errorSpy = vi.spyOn(log, "error");
            const error = new Error("release failed");
            vi.spyOn(adapter, "release").mockRejectedValueOnce(error);
            const enhanced = withPlugin(adapter, withLockLogging(log));

            await expect(enhanced.release("myKey", "lockId")).rejects.toThrow(
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
