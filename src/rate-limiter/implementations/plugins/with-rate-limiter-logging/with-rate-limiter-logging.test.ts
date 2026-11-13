import { beforeEach, describe, expect, test, vi } from "vitest";

import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";
import { Log } from "@/log/implementations/derivables/_module-exports.js";
import { NoOpLogTransport } from "@/log/implementations/transports/no-op-log-transport/_module-exports.js";
import { withPlugin } from "@/middleware/implementations/with-plugin-factory/_module.js";
import { NoOpRateLimiterAdapter } from "@/rate-limiter/implementations/adapters/no-op-rate-limiter-adapter/_module-exports.js";
import { withRateLimiterLogging } from "@/rate-limiter/implementations/plugins/with-rate-limiter-logging/with-rate-limiter-logging.js";

describe("function: withRateLimiterLogging", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    describe("entry metadata", () => {
        test("Should attach the group, the adapter class name, the key and the state", async () => {
            class TestAdapter extends NoOpRateLimiterAdapter {}
            const adapter = new TestAdapter();
            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            const transport = new NoOpLogTransport();
            const logSpy = vi.spyOn(transport, "log");
            const resetTime = new Date(0);
            vi.spyOn(adapter, "getState").mockResolvedValueOnce({
                success: true,
                attempt: 1,
                resetTime,
            });
            const log = new Log({ transport, executionContext });
            const enhanced = withPlugin(adapter, withRateLimiterLogging(log));

            await enhanced.getState("myKey");

            const entry = logSpy.mock.calls[0]?.[0];
            expect(entry?.messages).toEqual(["getState succeeded"]);
            expect(entry?.group).toEqual("[RateLimiter]");
            expect(entry?.metadata).toEqual({
                adapter: "TestAdapter",
                key: "myKey",
                state: {
                    success: true,
                    attempt: 1,
                    resetTime,
                },
            });
        });

        test("Should attach the error without metadata when the call fails", async () => {
            class TestAdapter extends NoOpRateLimiterAdapter {}
            const adapter = new TestAdapter();
            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            const transport = new NoOpLogTransport();
            const logSpy = vi.spyOn(transport, "log");
            const error = new Error("getState failed");
            vi.spyOn(adapter, "getState").mockRejectedValueOnce(error);
            const log = new Log({ transport, executionContext });
            const enhanced = withPlugin(adapter, withRateLimiterLogging(log));

            await expect(enhanced.getState("myKey")).rejects.toThrow(error);

            const entry = logSpy.mock.calls[0]?.[0];
            expect(entry?.level).toEqual("error");
            expect(entry?.messages).toEqual(["getState failed"]);
            expect(entry?.error).toBe(error);
            expect(entry?.metadata).toBeUndefined();
        });
    });

    describe("method: getState", () => {
        test("Should log a debug entry with the returned state", async () => {
            const adapter = new NoOpRateLimiterAdapter();
            const log = new Log({
                transport: new NoOpLogTransport(),
            });
            const debugSpy = vi.spyOn(log, "debug");
            const resetTime = new Date(0);
            vi.spyOn(adapter, "getState").mockResolvedValueOnce({
                success: true,
                attempt: 1,
                resetTime,
            });
            const enhanced = withPlugin(adapter, withRateLimiterLogging(log));

            await enhanced.getState("myKey");

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                ["getState succeeded"],
                {
                    group: "[RateLimiter]",
                    metadata: {
                        adapter: "NoOpRateLimiterAdapter",
                        key: "myKey",
                        state: {
                            success: true,
                            attempt: 1,
                            resetTime,
                        },
                    },
                },
            );
        });

        test("Should log an error entry and rethrow when the call fails", async () => {
            const adapter = new NoOpRateLimiterAdapter();
            const log = new Log({
                transport: new NoOpLogTransport(),
            });
            const debugSpy = vi.spyOn(log, "debug");
            const errorSpy = vi.spyOn(log, "error");
            const error = new Error("getState failed");
            vi.spyOn(adapter, "getState").mockRejectedValueOnce(error);
            const enhanced = withPlugin(adapter, withRateLimiterLogging(log));

            await expect(enhanced.getState("myKey")).rejects.toThrow(error);

            expect(debugSpy).not.toHaveBeenCalled();
            expect(errorSpy).toHaveBeenCalledExactlyOnceWith(
                ["getState failed"],
                { error },
            );
        });
    });

    describe("method: reset", () => {
        test("Should log a debug entry when the call succeeds", async () => {
            const adapter = new NoOpRateLimiterAdapter();
            const log = new Log({
                transport: new NoOpLogTransport(),
            });
            const debugSpy = vi.spyOn(log, "debug");
            const enhanced = withPlugin(adapter, withRateLimiterLogging(log));

            await enhanced.reset("myKey");

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                ["reset succeeded"],
                {
                    group: "[RateLimiter]",
                    metadata: {
                        adapter: "NoOpRateLimiterAdapter",
                        key: "myKey",
                    },
                },
            );
        });

        test("Should log an error entry and rethrow when the call fails", async () => {
            const adapter = new NoOpRateLimiterAdapter();
            const log = new Log({
                transport: new NoOpLogTransport(),
            });
            const debugSpy = vi.spyOn(log, "debug");
            const errorSpy = vi.spyOn(log, "error");
            const error = new Error("reset failed");
            vi.spyOn(adapter, "reset").mockRejectedValueOnce(error);
            const enhanced = withPlugin(adapter, withRateLimiterLogging(log));

            await expect(enhanced.reset("myKey")).rejects.toThrow(error);

            expect(debugSpy).not.toHaveBeenCalled();
            expect(errorSpy).toHaveBeenCalledExactlyOnceWith(["reset failed"], {
                error,
            });
        });
    });

    describe("method: updateState", () => {
        test("Should log a debug entry with the returned state", async () => {
            const adapter = new NoOpRateLimiterAdapter();
            const log = new Log({
                transport: new NoOpLogTransport(),
            });
            const debugSpy = vi.spyOn(log, "debug");
            const resetTime = new Date(0);
            vi.spyOn(adapter, "updateState").mockResolvedValueOnce({
                success: true,
                attempt: 1,
                resetTime,
            });
            const enhanced = withPlugin(adapter, withRateLimiterLogging(log));

            await enhanced.updateState("myKey", 5);

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                ["updateState succeeded"],
                {
                    group: "[RateLimiter]",
                    metadata: {
                        adapter: "NoOpRateLimiterAdapter",
                        key: "myKey",
                        limit: 5,
                        state: {
                            success: true,
                            attempt: 1,
                            resetTime,
                        },
                    },
                },
            );
        });

        test("Should log an error entry and rethrow when the call fails", async () => {
            const adapter = new NoOpRateLimiterAdapter();
            const log = new Log({
                transport: new NoOpLogTransport(),
            });
            const debugSpy = vi.spyOn(log, "debug");
            const errorSpy = vi.spyOn(log, "error");
            const error = new Error("updateState failed");
            vi.spyOn(adapter, "updateState").mockRejectedValueOnce(error);
            const enhanced = withPlugin(adapter, withRateLimiterLogging(log));

            await expect(enhanced.updateState("myKey", 5)).rejects.toThrow(
                error,
            );

            expect(debugSpy).not.toHaveBeenCalled();
            expect(errorSpy).toHaveBeenCalledExactlyOnceWith(
                ["updateState failed"],
                { error },
            );
        });
    });
});
