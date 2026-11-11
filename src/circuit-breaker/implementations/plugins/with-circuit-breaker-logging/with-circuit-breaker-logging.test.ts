import { beforeEach, describe, expect, test, vi } from "vitest";

import { CIRCUIT_BREAKER_STATE } from "@/circuit-breaker/contracts/_module-exports.js";
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
        test("Should attach the group, the adapter class name, the key and the state", async () => {
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

            await enhanced.getState("myKey");

            const entry = logSpy.mock.calls[0]?.[0];
            expect(entry?.messages).toEqual(["getState succeeded"]);
            expect(entry?.group).toEqual("[CircuitBreaker]");
            expect(entry?.metadata).toEqual({
                adapter: "TestAdapter",
                key: "myKey",
                state: CIRCUIT_BREAKER_STATE.CLOSED,
            });
        });

        test("Should attach the state transition returned by updateState", async () => {
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

            await enhanced.updateState("myKey");

            const entry = logSpy.mock.calls[0]?.[0];
            expect(entry?.messages).toEqual(["updateState succeeded"]);
            expect(entry?.group).toEqual("[CircuitBreaker]");
            expect(entry?.metadata).toEqual({
                adapter: "TestAdapter",
                key: "myKey",
                transition: {
                    from: CIRCUIT_BREAKER_STATE.CLOSED,
                    to: CIRCUIT_BREAKER_STATE.CLOSED,
                },
            });
        });

        test("Should attach the error without metadata when the call fails", async () => {
            class TestAdapter extends NoOpCircuitBreakerAdapter {}
            const adapter = new TestAdapter();
            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            const transport = new NoOpLoggerTransport();
            const logSpy = vi.spyOn(transport, "log");
            const logger = new Logger({ transport, executionContext });
            const error = new Error("getState failed");
            vi.spyOn(adapter, "getState").mockRejectedValueOnce(error);
            const enhanced = withPlugin(
                adapter,
                withCircuitBreakerLogging(logger),
            );

            await expect(enhanced.getState("myKey")).rejects.toThrow(error);

            const entry = logSpy.mock.calls[0]?.[0];
            expect(entry?.level).toEqual("error");
            expect(entry?.messages).toEqual(["getState failed"]);
            expect(entry?.error).toBe(error);
            expect(entry?.metadata).toBeUndefined();
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

            const state = await enhanced.getState("myKey");

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                ["getState succeeded"],
                {
                    group: "[CircuitBreaker]",
                    metadata: {
                        adapter: "NoOpCircuitBreakerAdapter",
                        key: "myKey",
                        state: CIRCUIT_BREAKER_STATE.CLOSED,
                    },
                },
            );
            expect(state).toEqual(CIRCUIT_BREAKER_STATE.CLOSED);
        });

        test("Should log an error entry and rethrow when the call fails", async () => {
            const adapter = new NoOpCircuitBreakerAdapter();
            const logger = new Logger({
                transport: new NoOpLoggerTransport(),
            });
            const debugSpy = vi.spyOn(logger, "debug");
            const errorSpy = vi.spyOn(logger, "error");
            const error = new Error("getState failed");
            vi.spyOn(adapter, "getState").mockRejectedValueOnce(error);
            const enhanced = withPlugin(
                adapter,
                withCircuitBreakerLogging(logger),
            );

            await expect(enhanced.getState("myKey")).rejects.toThrow(error);

            expect(debugSpy).not.toHaveBeenCalled();
            expect(errorSpy).toHaveBeenCalledExactlyOnceWith(
                ["getState failed"],
                { error },
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
                ["isolate succeeded"],
                {
                    group: "[CircuitBreaker]",
                    metadata: {
                        adapter: "NoOpCircuitBreakerAdapter",
                        key: "myKey",
                    },
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
            const error = new Error("isolate failed");
            vi.spyOn(adapter, "isolate").mockRejectedValueOnce(error);
            const enhanced = withPlugin(
                adapter,
                withCircuitBreakerLogging(logger),
            );

            await expect(enhanced.isolate("myKey")).rejects.toThrow(error);

            expect(debugSpy).not.toHaveBeenCalled();
            expect(errorSpy).toHaveBeenCalledExactlyOnceWith(
                ["isolate failed"],
                { error },
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
                ["reset succeeded"],
                {
                    group: "[CircuitBreaker]",
                    metadata: {
                        adapter: "NoOpCircuitBreakerAdapter",
                        key: "myKey",
                    },
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
            const error = new Error("reset failed");
            vi.spyOn(adapter, "reset").mockRejectedValueOnce(error);
            const enhanced = withPlugin(
                adapter,
                withCircuitBreakerLogging(logger),
            );

            await expect(enhanced.reset("myKey")).rejects.toThrow(error);

            expect(debugSpy).not.toHaveBeenCalled();
            expect(errorSpy).toHaveBeenCalledExactlyOnceWith(["reset failed"], {
                error,
            });
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
                ["trackFailure succeeded"],
                {
                    group: "[CircuitBreaker]",
                    metadata: {
                        adapter: "NoOpCircuitBreakerAdapter",
                        key: "myKey",
                    },
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
            const error = new Error("trackFailure failed");
            vi.spyOn(adapter, "trackFailure").mockRejectedValueOnce(error);
            const enhanced = withPlugin(
                adapter,
                withCircuitBreakerLogging(logger),
            );

            await expect(enhanced.trackFailure("myKey")).rejects.toThrow(error);

            expect(debugSpy).not.toHaveBeenCalled();
            expect(errorSpy).toHaveBeenCalledExactlyOnceWith(
                ["trackFailure failed"],
                { error },
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
                ["trackSuccess succeeded"],
                {
                    group: "[CircuitBreaker]",
                    metadata: {
                        adapter: "NoOpCircuitBreakerAdapter",
                        key: "myKey",
                    },
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
            const error = new Error("trackSuccess failed");
            vi.spyOn(adapter, "trackSuccess").mockRejectedValueOnce(error);
            const enhanced = withPlugin(
                adapter,
                withCircuitBreakerLogging(logger),
            );

            await expect(enhanced.trackSuccess("myKey")).rejects.toThrow(error);

            expect(debugSpy).not.toHaveBeenCalled();
            expect(errorSpy).toHaveBeenCalledExactlyOnceWith(
                ["trackSuccess failed"],
                { error },
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

            const transition = await enhanced.updateState("myKey");

            expect(debugSpy).toHaveBeenCalledExactlyOnceWith(
                ["updateState succeeded"],
                {
                    group: "[CircuitBreaker]",
                    metadata: {
                        adapter: "NoOpCircuitBreakerAdapter",
                        key: "myKey",
                        transition: {
                            from: CIRCUIT_BREAKER_STATE.CLOSED,
                            to: CIRCUIT_BREAKER_STATE.CLOSED,
                        },
                    },
                },
            );
            expect(transition).toEqual({
                from: CIRCUIT_BREAKER_STATE.CLOSED,
                to: CIRCUIT_BREAKER_STATE.CLOSED,
            });
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
                ["updateState failed"],
                { error },
            );
        });
    });
});
