import { beforeEach, describe, expect, test, vi } from "vitest";

import { NoOpCircuitBreakerAdapter } from "@/circuit-breaker/implementations/adapters/no-op-circuit-breaker-adapter/_module-exports.js";
import { withCircuitBreakerLogging } from "@/circuit-breaker/implementations/plugins/with-circuit-breaker-logging/with-circuit-breaker-logging.js";
import { Logger } from "@/logger/implementations/derivables/_module-exports.js";
import { NoOpLoggerTransport } from "@/logger/implementations/transports/no-op-logger-transport/_module-exports.js";
import { withPlugin } from "@/middleware/implementations/with-plugin-factory/_module.js";

describe("function: withCircuitBreakerLogging", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    describe("entry naming", () => {
        test("Should name entries after the adapter class and the method", async () => {
            class TestAdapter extends NoOpCircuitBreakerAdapter {}
            const adapter = new TestAdapter();
            const logger = new Logger({
                transport: new NoOpLoggerTransport(),
            });
            const debugSpy = vi.spyOn(logger, "debug");
            const enhanced = withPlugin(
                adapter,
                withCircuitBreakerLogging(logger),
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
            const adapter = new NoOpCircuitBreakerAdapter();
            const logger = new Logger({
                transport: new NoOpLoggerTransport(),
            });
            const debugSpy = vi.spyOn(logger, "debug");
            const enhanced = withPlugin(
                adapter,
                withCircuitBreakerLogging(logger),
            );

            const result = await enhanced.getState("myKey");

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                "NoOpCircuitBreakerAdapter.getState succeeded",
                {
                    args: ["myKey"],
                    result,
                },
            );
        });
    });

    describe("method: isolate", () => {
        test("Should log a debug entry when the call succeeds", async () => {
            const adapter = new NoOpCircuitBreakerAdapter();
            const logger = new Logger({
                transport: new NoOpLoggerTransport(),
            });
            const debugSpy = vi.spyOn(logger, "debug");
            const enhanced = withPlugin(
                adapter,
                withCircuitBreakerLogging(logger),
            );

            await enhanced.isolate("myKey");

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                "NoOpCircuitBreakerAdapter.isolate succeeded",
                {
                    args: ["myKey"],
                    result: undefined,
                },
            );
        });
    });

    describe("method: reset", () => {
        test("Should log a debug entry when the call succeeds", async () => {
            const adapter = new NoOpCircuitBreakerAdapter();
            const logger = new Logger({
                transport: new NoOpLoggerTransport(),
            });
            const debugSpy = vi.spyOn(logger, "debug");
            const enhanced = withPlugin(
                adapter,
                withCircuitBreakerLogging(logger),
            );

            await enhanced.reset("myKey");

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                "NoOpCircuitBreakerAdapter.reset succeeded",
                {
                    args: ["myKey"],
                    result: undefined,
                },
            );
        });
    });

    describe("method: trackFailure", () => {
        test("Should log a debug entry when the call succeeds", async () => {
            const adapter = new NoOpCircuitBreakerAdapter();
            const logger = new Logger({
                transport: new NoOpLoggerTransport(),
            });
            const debugSpy = vi.spyOn(logger, "debug");
            const enhanced = withPlugin(
                adapter,
                withCircuitBreakerLogging(logger),
            );

            await enhanced.trackFailure("myKey");

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                "NoOpCircuitBreakerAdapter.trackFailure succeeded",
                {
                    args: ["myKey"],
                    result: undefined,
                },
            );
        });
    });

    describe("method: trackSuccess", () => {
        test("Should log a debug entry when the call succeeds", async () => {
            const adapter = new NoOpCircuitBreakerAdapter();
            const logger = new Logger({
                transport: new NoOpLoggerTransport(),
            });
            const debugSpy = vi.spyOn(logger, "debug");
            const enhanced = withPlugin(
                adapter,
                withCircuitBreakerLogging(logger),
            );

            await enhanced.trackSuccess("myKey");

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                "NoOpCircuitBreakerAdapter.trackSuccess succeeded",
                {
                    args: ["myKey"],
                    result: undefined,
                },
            );
        });
    });

    describe("method: updateState", () => {
        test("Should log a debug entry when the call succeeds", async () => {
            const adapter = new NoOpCircuitBreakerAdapter();
            const logger = new Logger({
                transport: new NoOpLoggerTransport(),
            });
            const debugSpy = vi.spyOn(logger, "debug");
            const enhanced = withPlugin(
                adapter,
                withCircuitBreakerLogging(logger),
            );

            const result = await enhanced.updateState("myKey");

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                "NoOpCircuitBreakerAdapter.updateState succeeded",
                {
                    args: ["myKey"],
                    result,
                },
            );
        });

        test("Should log an error entry and rethrow when the call fails", async () => {
            const adapter = new NoOpCircuitBreakerAdapter();
            const logger = new Logger({
                transport: new NoOpLoggerTransport(),
            });
            const debugSpy = vi.spyOn(logger, "debug");
            const errorSpy = vi.spyOn(logger, "error");
            const error = new Error("updateState failed");
            vi.spyOn(adapter, "updateState").mockRejectedValueOnce(error);
            const enhanced = withPlugin(
                adapter,
                withCircuitBreakerLogging(logger),
            );

            await expect(enhanced.updateState("myKey")).rejects.toThrow(error);

            expect(debugSpy).not.toHaveBeenCalled();
            expect(errorSpy).toHaveBeenCalledExactlyOnceWith(
                "NoOpCircuitBreakerAdapter.updateState failed",
                {
                    args: ["myKey"],
                    error,
                },
            );
        });
    });
});
