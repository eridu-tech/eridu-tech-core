import { beforeEach, describe, expect, test, vi } from "vitest";

import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";
import { Logger } from "@/logger/implementations/derivables/_module-exports.js";
import { NoOpLoggerTransport } from "@/logger/implementations/transports/no-op-logger-transport/_module-exports.js";
import { withPlugin } from "@/middleware/implementations/with-plugin-factory/_module.js";
import { NoOpRateLimiterAdapter } from "@/rate-limiter/implementations/adapters/no-op-rate-limiter-adapter/_module-exports.js";
import { withRateLimiterLogging } from "@/rate-limiter/implementations/plugins/with-rate-limiter-logging/with-rate-limiter-logging.js";

describe("function: withRateLimiterLogging", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    describe("entry metadata", () => {
        test("Should attach the adapter class name, the arguments and the result", async () => {
            class TestAdapter extends NoOpRateLimiterAdapter {}
            const adapter = new TestAdapter();
            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            const transport = new NoOpLoggerTransport();
            const logSpy = vi.spyOn(transport, "log");
            const logger = new Logger({ transport, executionContext });
            const enhanced = withPlugin(
                adapter,
                withRateLimiterLogging(logger),
            );

            await enhanced.reset("myKey");

            const entry = logSpy.mock.calls[0]?.[0];
            expect(entry?.messages).toEqual(["rateLimiter.reset succeeded"]);
            expect(entry?.metadata).toEqual({
                "rateLimiter.adapter": "TestAdapter",
                "rateLimiter.args": ["myKey"],
                "rateLimiter.result": undefined,
            });
        });
    });

    describe("method: getState", () => {
        test("Should log a debug entry when the call succeeds", async () => {
            const adapter = new NoOpRateLimiterAdapter();
            const logger = new Logger({
                transport: new NoOpLoggerTransport(),
            });
            const debugSpy = vi.spyOn(logger, "debug");
            const enhanced = withPlugin(
                adapter,
                withRateLimiterLogging(logger),
            );

            await enhanced.getState("myKey");

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                "rateLimiter.getState succeeded",
            );
        });
    });

    describe("method: reset", () => {
        test("Should log a debug entry when the call succeeds", async () => {
            const adapter = new NoOpRateLimiterAdapter();
            const logger = new Logger({
                transport: new NoOpLoggerTransport(),
            });
            const debugSpy = vi.spyOn(logger, "debug");
            const enhanced = withPlugin(
                adapter,
                withRateLimiterLogging(logger),
            );

            await enhanced.reset("myKey");

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                "rateLimiter.reset succeeded",
            );
        });
    });

    describe("method: updateState", () => {
        test("Should log a debug entry when the call succeeds", async () => {
            const adapter = new NoOpRateLimiterAdapter();
            const logger = new Logger({
                transport: new NoOpLoggerTransport(),
            });
            const debugSpy = vi.spyOn(logger, "debug");
            const enhanced = withPlugin(
                adapter,
                withRateLimiterLogging(logger),
            );

            await enhanced.updateState("myKey", 5);

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                "rateLimiter.updateState succeeded",
            );
        });

        test("Should log an error entry and rethrow when the call fails", async () => {
            const adapter = new NoOpRateLimiterAdapter();
            const logger = new Logger({
                transport: new NoOpLoggerTransport(),
            });
            const debugSpy = vi.spyOn(logger, "debug");
            const errorSpy = vi.spyOn(logger, "error");
            const error = new Error("updateState failed");
            vi.spyOn(adapter, "updateState").mockRejectedValueOnce(error);
            const enhanced = withPlugin(
                adapter,
                withRateLimiterLogging(logger),
            );

            await expect(enhanced.updateState("myKey", 5)).rejects.toThrow(
                error,
            );

            expect(debugSpy).not.toHaveBeenCalled();
            expect(errorSpy).toHaveBeenCalledExactlyOnceWith(
                "rateLimiter.updateState failed",
            );
        });
    });
});
