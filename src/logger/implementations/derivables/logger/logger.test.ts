import { afterEach, describe, expect, test, vi } from "vitest";

import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";
import { LOG_LEVEL } from "@/logger/contracts/_module-exports.js";
import { Logger } from "@/logger/implementations/derivables/_module-exports.js";
import { NoOpLoggerTransport } from "@/logger/implementations/transports/no-op-logger-transport/_module-exports.js";
import { createIsTimeSpanEqualityTester } from "@/test-utilities/_module.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";
import { delay } from "@/utilities/_module-exports.js";

const TIME_SPAN_EQUALITY_BUFFER = TimeSpan.fromMilliseconds(100);

describe("class: Logger", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("method: span", () => {
        test("Should attach the span to entries logged while it runs", async () => {
            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            const transport = new NoOpLoggerTransport();
            const logSpy = vi.spyOn(transport, "log");
            const logger = new Logger({ transport, executionContext });

            await executionContext.run(async () => {
                await logger.span("db", async () => {
                    await delay(TimeSpan.fromMilliseconds(10));
                    logger.info("inside");
                });
            });

            expect.addEqualityTesters([
                createIsTimeSpanEqualityTester(TIME_SPAN_EQUALITY_BUFFER),
            ]);

            expect(logSpy).toHaveBeenCalledExactlyOnceWith(
                expect.objectContaining({
                    messages: ["inside"],
                    spans: { db: TimeSpan.fromMilliseconds(10) },
                }),
            );
        });

        test("Should not attach the span to entries logged after it returns", async () => {
            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            const transport = new NoOpLoggerTransport();
            const logSpy = vi.spyOn(transport, "log");
            const logger = new Logger({ transport, executionContext });

            await executionContext.run(async () => {
                await logger.span("db", () => Promise.resolve());
                logger.info("after");
            });

            expect(logSpy).toHaveBeenCalledExactlyOnceWith(
                expect.objectContaining({
                    messages: ["after"],
                    spans: {},
                }),
            );
        });

        test("Should attach every enclosing span when nested", () => {
            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            const transport = new NoOpLoggerTransport();
            const logSpy = vi.spyOn(transport, "log");
            const logger = new Logger({ transport, executionContext });

            executionContext.run(() => {
                logger.span("outer", () => {
                    logger.info("a");
                    logger.span("inner", () => {
                        logger.info("b");
                    });
                    logger.info("c");
                });
            });

            expect.addEqualityTesters([
                createIsTimeSpanEqualityTester(TIME_SPAN_EQUALITY_BUFFER),
            ]);

            expect(logSpy).toHaveBeenCalledTimes(3);
            expect(logSpy).toHaveBeenNthCalledWith(
                1,
                expect.objectContaining({
                    messages: ["a"],
                    spans: { outer: TimeSpan.fromMilliseconds(0) },
                }),
            );
            expect(logSpy).toHaveBeenNthCalledWith(
                2,
                expect.objectContaining({
                    messages: ["b"],
                    spans: {
                        inner: TimeSpan.fromMilliseconds(0),
                        outer: TimeSpan.fromMilliseconds(0),
                    },
                }),
            );
            expect(logSpy).toHaveBeenNthCalledWith(
                3,
                expect.objectContaining({
                    messages: ["c"],
                    spans: { outer: TimeSpan.fromMilliseconds(0) },
                }),
            );
        });

        test("Should report a larger elapsed time for later entries", async () => {
            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            const transport = new NoOpLoggerTransport();
            const logSpy = vi.spyOn(transport, "log");
            const logger = new Logger({ transport, executionContext });

            await executionContext.run(async () => {
                await logger.span("db", async () => {
                    logger.info("start");
                    await delay(TimeSpan.fromMilliseconds(20));
                    logger.info("end");
                });
            });

            const startSpans = logSpy.mock.calls[0]?.[0]?.spans;
            const endSpans = logSpy.mock.calls[1]?.[0]?.spans;
            const start = startSpans?.["db"]?.toMilliseconds() ?? 0;
            const end = endSpans?.["db"]?.toMilliseconds() ?? 0;

            expect(end).toBeGreaterThan(start);
        });

        test("Should support a synchronous invocable", () => {
            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            const transport = new NoOpLoggerTransport();
            const logSpy = vi.spyOn(transport, "log");
            const logger = new Logger({ transport, executionContext });

            executionContext.run(() => {
                logger.span("db", () => {
                    logger.info("inside");
                });
            });

            expect.addEqualityTesters([
                createIsTimeSpanEqualityTester(TIME_SPAN_EQUALITY_BUFFER),
            ]);

            expect(logSpy).toHaveBeenCalledExactlyOnceWith(
                expect.objectContaining({
                    messages: ["inside"],
                    spans: { db: TimeSpan.fromMilliseconds(0) },
                }),
            );
        });

        test("Should return the value of the invocable", async () => {
            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            const transport = new NoOpLoggerTransport();
            const logger = new Logger({ transport, executionContext });

            await executionContext.run(async () => {
                await expect(
                    logger.span("db", () => Promise.resolve("result")),
                ).resolves.toBe("result");
            });
        });

        test("Should keep concurrent spans isolated", async () => {
            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            const transport = new NoOpLoggerTransport();
            const logSpy = vi.spyOn(transport, "log");
            const logger = new Logger({ transport, executionContext });

            await executionContext.run(async () => {
                await Promise.all([
                    logger.span("a", async () => {
                        await delay(TimeSpan.fromMilliseconds(5));
                        logger.info("in-a");
                    }),
                    logger.span("b", async () => {
                        await delay(TimeSpan.fromMilliseconds(20));
                        logger.info("in-b");
                    }),
                ]);
            });

            expect.addEqualityTesters([
                createIsTimeSpanEqualityTester(TIME_SPAN_EQUALITY_BUFFER),
            ]);

            expect(logSpy).toHaveBeenNthCalledWith(
                1,
                expect.objectContaining({
                    messages: ["in-a"],
                    spans: { a: TimeSpan.fromMilliseconds(5) },
                }),
            );
            expect(logSpy).toHaveBeenNthCalledWith(
                2,
                expect.objectContaining({
                    messages: ["in-b"],
                    spans: { b: TimeSpan.fromMilliseconds(20) },
                }),
            );
        });

        test("Should propagate a synchronous error", () => {
            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            const transport = new NoOpLoggerTransport();
            const logger = new Logger({ transport, executionContext });

            executionContext.run(() => {
                expect(() => {
                    logger.span("db", () => {
                        throw new Error("boom");
                    });
                }).toThrow("boom");
            });
        });

        test("Should propagate a rejection", async () => {
            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            const transport = new NoOpLoggerTransport();
            const logger = new Logger({ transport, executionContext });

            await executionContext.run(async () => {
                await expect(
                    logger.span("db", () => Promise.reject(new Error("boom"))),
                ).rejects.toThrow("boom");
            });
        });
    });

    describe("method: scopedMetadata", () => {
        test("Should attach metadata to entries logged while it runs", () => {
            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            const transport = new NoOpLoggerTransport();
            const logSpy = vi.spyOn(transport, "log");
            const logger = new Logger({ transport, executionContext });

            executionContext.run(() => {
                logger.scopedMetadata({ requestId: "r1" }, () => {
                    logger.info("inside");
                });
            });

            expect(logSpy).toHaveBeenCalledExactlyOnceWith(
                expect.objectContaining({
                    messages: ["inside"],
                    metadata: { requestId: "r1" },
                }),
            );
        });

        test("Should not attach metadata to entries logged after it returns", () => {
            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            const transport = new NoOpLoggerTransport();
            const logSpy = vi.spyOn(transport, "log");
            const logger = new Logger({ transport, executionContext });

            executionContext.run(() => {
                logger.scopedMetadata({ requestId: "r1" }, () => undefined);
                logger.info("after");
            });

            expect(logSpy).toHaveBeenCalledExactlyOnceWith(
                expect.objectContaining({
                    messages: ["after"],
                    metadata: {},
                }),
            );
        });

        test("Should merge nested metadata and restore the outer scope", () => {
            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            const transport = new NoOpLoggerTransport();
            const logSpy = vi.spyOn(transport, "log");
            const logger = new Logger({ transport, executionContext });

            executionContext.run(() => {
                logger.scopedMetadata({ requestId: "r1" }, () => {
                    logger.info("a");
                    logger.scopedMetadata({ userId: "u1" }, () => {
                        logger.info("b");
                    });
                    logger.info("c");
                });
            });

            expect(logSpy).toHaveBeenCalledTimes(3);
            expect(logSpy).toHaveBeenNthCalledWith(
                1,
                expect.objectContaining({
                    messages: ["a"],
                    metadata: { requestId: "r1" },
                }),
            );
            expect(logSpy).toHaveBeenNthCalledWith(
                2,
                expect.objectContaining({
                    messages: ["b"],
                    metadata: { requestId: "r1", userId: "u1" },
                }),
            );
            expect(logSpy).toHaveBeenNthCalledWith(
                3,
                expect.objectContaining({
                    messages: ["c"],
                    metadata: { requestId: "r1" },
                }),
            );
        });

        test("Should let inner metadata override an outer key", () => {
            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            const transport = new NoOpLoggerTransport();
            const logSpy = vi.spyOn(transport, "log");
            const logger = new Logger({ transport, executionContext });

            executionContext.run(() => {
                logger.scopedMetadata({ userId: "outer" }, () => {
                    logger.info("a");
                    logger.scopedMetadata({ userId: "inner" }, () => {
                        logger.info("b");
                    });
                    logger.info("c");
                });
            });

            expect(logSpy).toHaveBeenNthCalledWith(
                1,
                expect.objectContaining({ metadata: { userId: "outer" } }),
            );
            expect(logSpy).toHaveBeenNthCalledWith(
                2,
                expect.objectContaining({ metadata: { userId: "inner" } }),
            );
            expect(logSpy).toHaveBeenNthCalledWith(
                3,
                expect.objectContaining({ metadata: { userId: "outer" } }),
            );
        });

        test("Should return the value of the invocable", async () => {
            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            const transport = new NoOpLoggerTransport();
            const logger = new Logger({ transport, executionContext });

            await executionContext.run(async () => {
                await expect(
                    logger.scopedMetadata({ requestId: "r1" }, () =>
                        Promise.resolve("result"),
                    ),
                ).resolves.toBe("result");
            });
        });

        test("Should attach a single key-value pair to entries logged while it runs", () => {
            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            const transport = new NoOpLoggerTransport();
            const logSpy = vi.spyOn(transport, "log");
            const logger = new Logger({ transport, executionContext });

            executionContext.run(() => {
                logger.scopedMetadata("requestId", "r1", () => {
                    logger.info("inside");
                });
            });

            expect(logSpy).toHaveBeenCalledExactlyOnceWith(
                expect.objectContaining({
                    messages: ["inside"],
                    metadata: { requestId: "r1" },
                }),
            );
        });

        test("Should merge a single key-value pair with the enclosing metadata", () => {
            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            const transport = new NoOpLoggerTransport();
            const logSpy = vi.spyOn(transport, "log");
            const logger = new Logger({ transport, executionContext });

            executionContext.run(() => {
                logger.scopedMetadata({ requestId: "r1" }, () => {
                    logger.scopedMetadata("userId", "u1", () => {
                        logger.info("inside");
                    });
                });
            });

            expect(logSpy).toHaveBeenCalledExactlyOnceWith(
                expect.objectContaining({
                    messages: ["inside"],
                    metadata: { requestId: "r1", userId: "u1" },
                }),
            );
        });
    });

    describe("method: putMetadata", () => {
        test("Should merge values into the current scope", () => {
            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            const transport = new NoOpLoggerTransport();
            const logSpy = vi.spyOn(transport, "log");
            const logger = new Logger({ transport, executionContext });

            executionContext.run(() => {
                logger.putMetadata({ requestId: "r1" });
                logger.info("first");
                logger.putMetadata({ userId: "u1" });
                logger.info("second");
            });

            expect(logSpy).toHaveBeenNthCalledWith(
                1,
                expect.objectContaining({
                    messages: ["first"],
                    metadata: { requestId: "r1" },
                }),
            );
            expect(logSpy).toHaveBeenNthCalledWith(
                2,
                expect.objectContaining({
                    messages: ["second"],
                    metadata: { requestId: "r1", userId: "u1" },
                }),
            );
        });

        test("Should not restore the values after the scope ends", () => {
            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            const transport = new NoOpLoggerTransport();
            const logSpy = vi.spyOn(transport, "log");
            const logger = new Logger({ transport, executionContext });

            executionContext.run(() => {
                logger.putMetadata({ requestId: "r1" });
                logger.info("inside");
            });
            logger.info("outside");

            expect(logSpy).toHaveBeenNthCalledWith(
                2,
                expect.objectContaining({
                    messages: ["outside"],
                    metadata: {},
                }),
            );
        });

        test("Should merge a single key-value pair into the current scope", () => {
            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            const transport = new NoOpLoggerTransport();
            const logSpy = vi.spyOn(transport, "log");
            const logger = new Logger({ transport, executionContext });

            executionContext.run(() => {
                logger.putMetadata("requestId", "r1");
                logger.info("inside");
            });

            expect(logSpy).toHaveBeenCalledExactlyOnceWith(
                expect.objectContaining({
                    messages: ["inside"],
                    metadata: { requestId: "r1" },
                }),
            );
        });

        test("Should override an existing key with a single key-value pair", () => {
            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            const transport = new NoOpLoggerTransport();
            const logSpy = vi.spyOn(transport, "log");
            const logger = new Logger({ transport, executionContext });

            executionContext.run(() => {
                logger.putMetadata({ userId: "outer" });
                logger.putMetadata("userId", "inner");
                logger.info("inside");
            });

            expect(logSpy).toHaveBeenCalledExactlyOnceWith(
                expect.objectContaining({
                    messages: ["inside"],
                    metadata: { userId: "inner" },
                }),
            );
        });

        test("Should merge a single key-value pair inside a scopedMetadata scope", () => {
            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            const transport = new NoOpLoggerTransport();
            const logSpy = vi.spyOn(transport, "log");
            const logger = new Logger({ transport, executionContext });

            executionContext.run(() => {
                logger.scopedMetadata("requestId", "r1", () => {
                    logger.putMetadata("userId", "u1");
                    logger.info("inside");
                });
            });

            expect(logSpy).toHaveBeenCalledExactlyOnceWith(
                expect.objectContaining({
                    messages: ["inside"],
                    metadata: { requestId: "r1", userId: "u1" },
                }),
            );
        });
    });

    describe("method: span with method: scopedMetadata", () => {
        test("Should attach spans and metadata on the same entry", () => {
            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            const transport = new NoOpLoggerTransport();
            const logSpy = vi.spyOn(transport, "log");
            const logger = new Logger({ transport, executionContext });

            executionContext.run(() => {
                logger.scopedMetadata({ requestId: "r1" }, () => {
                    logger.span("db", () => {
                        logger.info("inside");
                    });
                });
            });

            expect.addEqualityTesters([
                createIsTimeSpanEqualityTester(TIME_SPAN_EQUALITY_BUFFER),
            ]);

            expect(logSpy).toHaveBeenCalledExactlyOnceWith(
                expect.objectContaining({
                    messages: ["inside"],
                    metadata: { requestId: "r1" },
                    spans: { db: TimeSpan.fromMilliseconds(0) },
                }),
            );
        });
    });

    describe("method: verbose", () => {
        test("Should forward entries at the verbose level", () => {
            const transport = new NoOpLoggerTransport();
            const logSpy = vi.spyOn(transport, "log");
            const logger = new Logger({ transport });

            logger.verbose("details", { step: 1 });

            expect(logSpy).toHaveBeenCalledExactlyOnceWith(
                expect.objectContaining({
                    level: LOG_LEVEL.VERBOSE,
                    messages: ["details", { step: 1 }],
                }),
            );
        });
    });

    describe("transport", () => {
        test("Should forward every level to the transport instance", () => {
            const transport = new NoOpLoggerTransport();
            const logSpy = vi.spyOn(transport, "log");
            const logger = new Logger({ transport });

            logger.debug("a");
            logger.verbose("b");
            logger.info("c");
            logger.warn("d");
            logger.error("e");
            logger.fatal("f");

            const levels = logSpy.mock.calls.map(([data]) => {
                return data.level;
            });
            expect(levels).toStrictEqual([
                LOG_LEVEL.DEBUG,
                LOG_LEVEL.VERBOSE,
                LOG_LEVEL.INFO,
                LOG_LEVEL.WARN,
                LOG_LEVEL.ERROR,
                LOG_LEVEL.FATAL,
            ]);
        });
    });

    describe("without an outer execution context", () => {
        test("Should attach no spans and no metadata to a plain entry", () => {
            const transport = new NoOpLoggerTransport();
            const logSpy = vi.spyOn(transport, "log");
            const logger = new Logger({
                transport,
                executionContext: new ExecutionContext(
                    new AlsExecutionContextAdapter(),
                ),
            });

            logger.info("plain");

            expect(logSpy).toHaveBeenCalledExactlyOnceWith(
                expect.objectContaining({
                    messages: ["plain"],
                    spans: {},
                    metadata: {},
                }),
            );
        });

        test("Should still attach the span because span() opens its own scope", () => {
            const transport = new NoOpLoggerTransport();
            const logSpy = vi.spyOn(transport, "log");
            const logger = new Logger({
                transport,
                executionContext: new ExecutionContext(
                    new AlsExecutionContextAdapter(),
                ),
            });

            logger.span("db", () => {
                logger.info("inside");
            });

            expect.addEqualityTesters([
                createIsTimeSpanEqualityTester(TIME_SPAN_EQUALITY_BUFFER),
            ]);

            expect(logSpy).toHaveBeenCalledExactlyOnceWith(
                expect.objectContaining({
                    messages: ["inside"],
                    spans: { db: TimeSpan.fromMilliseconds(0) },
                }),
            );
        });
    });
});
