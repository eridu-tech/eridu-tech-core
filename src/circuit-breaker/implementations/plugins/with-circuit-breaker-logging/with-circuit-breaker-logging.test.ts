import { beforeEach, describe, expect, test, vi } from "vitest";

import { NoOpCircuitBreakerAdapter } from "@/circuit-breaker/implementations/adapters/no-op-circuit-breaker-adapter/_module-exports.js";
import { withCircuitBreakerLogging } from "@/circuit-breaker/implementations/plugins/with-circuit-breaker-logging/with-circuit-breaker-logging.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";
import { Logger } from "@/logger/implementations/derivables/_module-exports.js";
import { NoOpLoggerTransport } from "@/logger/implementations/transports/no-op-logger-transport/_module-exports.js";
import { withPlugin } from "@/middleware/implementations/with-plugin-factory/_module.js";

describe("function: withCircuitBreakerLogging", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    describe("entry metadata", () => {
        test("Should attach the adapter class name, the arguments and the result", async () => {
            class TestAdapter extends NoOpCircuitBreakerAdapter {}
            const adapter = new TestAdapter();
            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            const transport = new NoOpLoggerTransport();
            const logSpy = vi.spyOn(transport, "log");
            const logger = new Logger({ transport, executionContext });
            const enhanced = withPlugin(
                adapter,
                withCircuitBreakerLogging(logger),
            );

            await enhanced.reset("myKey");

            const entry = logSpy.mock.calls[0]?.[0];
            expect(entry?.messages).toEqual(["circuitBreaker.reset succeeded"]);
            expect(entry?.metadata).toEqual({
                "circuitBreaker.adapter": "TestAdapter",
                "circuitBreaker.args": ["myKey"],
                "circuitBreaker.result": undefined,
            });
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

            await enhanced.getState("myKey");

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                "circuitBreaker.getState succeeded",
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
                "circuitBreaker.isolate succeeded",
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
                "circuitBreaker.reset succeeded",
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
                "circuitBreaker.trackFailure succeeded",
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
                "circuitBreaker.trackSuccess succeeded",
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

            await enhanced.updateState("myKey");

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                "circuitBreaker.updateState succeeded",
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
                "circuitBreaker.updateState failed",
            );
        });
    });
});
