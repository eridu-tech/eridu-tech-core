import { beforeEach, describe, expect, test, vi } from "vitest";

import { Logger } from "@/logger/implementations/derivables/_module-exports.js";
import { NoOpLoggerTransport } from "@/logger/implementations/transports/no-op-logger-transport/_module-exports.js";
import { withPlugin } from "@/middleware/implementations/with-plugin-factory/_module.js";
import { NoOpRateLimiterAdapter } from "@/rate-limiter/implementations/adapters/no-op-rate-limiter-adapter/_module-exports.js";
import { withRateLimiterLogging } from "@/rate-limiter/implementations/plugins/with-rate-limiter-logging/with-rate-limiter-logging.js";

describe("function: withRateLimiterLogging", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    describe("entry naming", () => {
        test("Should name entries after the adapter class and the method", async () => {
            class TestAdapter extends NoOpRateLimiterAdapter {}
            const adapter = new TestAdapter();
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
                "TestAdapter.reset succeeded",
                {
                    args: ["myKey"],
                    result: undefined,
                },
            );
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

            const result = await enhanced.getState("myKey");

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                "NoOpRateLimiterAdapter.getState succeeded",
                {
                    args: ["myKey"],
                    result,
                },
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
                "NoOpRateLimiterAdapter.reset succeeded",
                {
                    args: ["myKey"],
                    result: undefined,
                },
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

            const result = await enhanced.updateState("myKey", 5);

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                "NoOpRateLimiterAdapter.updateState succeeded",
                {
                    args: ["myKey", 5],
                    result,
                },
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
                "NoOpRateLimiterAdapter.updateState failed",
                {
                    args: ["myKey", 5],
                    error,
                },
            );
        });
    });
});
