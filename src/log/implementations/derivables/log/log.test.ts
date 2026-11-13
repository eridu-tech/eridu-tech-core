import { afterEach, describe, expect, test, vi } from "vitest";

import { contextToken } from "@/execution-context/contracts/_module-exports.js";
import { AlsExecutionContextAdapter } from "@/execution-context/implementations/adapters/als-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";
import { LOG_LEVEL } from "@/log/contracts/_module-exports.js";
import { Log } from "@/log/implementations/derivables/_module-exports.js";
import { NoOpLogTransport } from "@/log/implementations/transports/no-op-log-transport/_module-exports.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";
import { delay } from "@/utilities/_module-exports.js";

import type { LogMetadata } from "@/log/contracts/_module-exports.js";

const SPAN_TIME_BUFFER_IN_MS = 100;

describe("class: Log", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("transport", () => {
        test("Should forward every level to the transport instance", () => {
            const transport = new NoOpLogTransport();
            const logSpy = vi.spyOn(transport, "log");
            const log = new Log({ transport });

            log.debug(["a"]);
            log.verbose(["b"]);
            log.info(["c"]);
            log.warn(["d"]);
            log.error(["e"]);
            log.fatal(["f"]);

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

        test("Should forward the same entry object to the transport", () => {
            const transport = new NoOpLogTransport();
            const logSpy = vi.spyOn(transport, "log");
            const log = new Log({ transport });

            log.info(["entry"]);

            expect(logSpy).toHaveBeenCalledExactlyOnceWith(
                expect.objectContaining({
                    messages: ["entry"],
                }),
            );
        });
    });

    describe("method: run", () => {
        describe("span", () => {
            test("Should attach the span to entries logged while it runs", () => {
                const transport = new NoOpLogTransport();
                const logSpy = vi.spyOn(transport, "log");
                const log = new Log({
                    transport,
                    executionContext: new ExecutionContext(
                        new AlsExecutionContextAdapter(),
                    ),
                });

                log.run(
                    () => {
                        log.info(["inside"]);
                    },
                    { span: "db" },
                );

                const entry = logSpy.mock.calls[0]?.[0];
                expect(entry?.messages).toStrictEqual(["inside"]);
                expect(entry?.spans?.["db"]?.toMilliseconds()).toBeLessThan(
                    SPAN_TIME_BUFFER_IN_MS,
                );
            });

            test("Should not attach the span to entries logged after it returns", () => {
                const transport = new NoOpLogTransport();
                const logSpy = vi.spyOn(transport, "log");
                const log = new Log({
                    transport,
                    executionContext: new ExecutionContext(
                        new AlsExecutionContextAdapter(),
                    ),
                });

                log.run(() => {}, { span: "db" });
                log.info(["after"]);

                const entry = logSpy.mock.calls[0]?.[0];
                expect(entry?.spans).toBeUndefined();
            });

            test("Should attach every enclosing span when nested", () => {
                const transport = new NoOpLogTransport();
                const logSpy = vi.spyOn(transport, "log");
                const log = new Log({
                    transport,
                    executionContext: new ExecutionContext(
                        new AlsExecutionContextAdapter(),
                    ),
                });

                log.run(
                    () => {
                        log.run(
                            () => {
                                log.info(["inner"]);
                            },
                            { span: "db" },
                        );
                    },
                    { span: "request" },
                );

                const entry = logSpy.mock.calls[0]?.[0];
                expect(Object.keys(entry?.spans ?? {}).sort()).toStrictEqual([
                    "db",
                    "request",
                ]);
            });

            test("Should report the elapsed time of the span", async () => {
                const transport = new NoOpLogTransport();
                const logSpy = vi.spyOn(transport, "log");
                const log = new Log({
                    transport,
                    executionContext: new ExecutionContext(
                        new AlsExecutionContextAdapter(),
                    ),
                });

                await log.run(
                    async () => {
                        await delay(TimeSpan.fromMilliseconds(20));
                        log.info(["slow"]);
                    },
                    { span: "db" },
                );

                const entry = logSpy.mock.calls[0]?.[0];
                expect(
                    entry?.spans?.["db"]?.toMilliseconds(),
                ).toBeGreaterThanOrEqual(20);
            });

            test("Should keep concurrent spans isolated", async () => {
                const executionContext = new ExecutionContext(
                    new AlsExecutionContextAdapter(),
                );
                const transport = new NoOpLogTransport();
                const logSpy = vi.spyOn(transport, "log");
                const log = new Log({ transport, executionContext });

                await Promise.all([
                    executionContext.run(async () => {
                        await log.run(
                            async () => {
                                await delay(TimeSpan.fromMilliseconds(20));
                                log.info(["first"]);
                            },
                            { span: "first" },
                        );
                    }),
                    executionContext.run(async () => {
                        await delay(TimeSpan.fromMilliseconds(5));
                        log.run(
                            () => {
                                log.info(["second"]);
                            },
                            { span: "second" },
                        );
                    }),
                ]);

                const entries = logSpy.mock.calls.map(([data]) => {
                    return data;
                });
                const first = entries.find((entry) => {
                    return entry.messages[0] === "first";
                });
                const second = entries.find((entry) => {
                    return entry.messages[0] === "second";
                });
                expect(Object.keys(first?.spans ?? {})).toStrictEqual([
                    "first",
                ]);
                expect(Object.keys(second?.spans ?? {})).toStrictEqual([
                    "second",
                ]);
            });
        });

        describe("metadata", () => {
            test("Should attach the metadata to entries logged while it runs", () => {
                const transport = new NoOpLogTransport();
                const logSpy = vi.spyOn(transport, "log");
                const log = new Log({
                    transport,
                    executionContext: new ExecutionContext(
                        new AlsExecutionContextAdapter(),
                    ),
                });

                log.run(
                    () => {
                        log.info(["inside"]);
                    },
                    { metadata: { requestId: "r1" } },
                );

                const entry = logSpy.mock.calls[0]?.[0];
                expect(entry?.metadata).toStrictEqual({ requestId: "r1" });
            });

            test("Should not attach the metadata to entries logged after it returns", () => {
                const transport = new NoOpLogTransport();
                const logSpy = vi.spyOn(transport, "log");
                const log = new Log({
                    transport,
                    executionContext: new ExecutionContext(
                        new AlsExecutionContextAdapter(),
                    ),
                });

                log.run(() => {}, { metadata: { requestId: "r1" } });
                log.info(["after"]);

                const entry = logSpy.mock.calls[0]?.[0];
                expect(entry?.metadata).toBeUndefined();
            });

            test("Should merge nested metadata and restore the outer metadata", () => {
                const transport = new NoOpLogTransport();
                const logSpy = vi.spyOn(transport, "log");
                const log = new Log({
                    transport,
                    executionContext: new ExecutionContext(
                        new AlsExecutionContextAdapter(),
                    ),
                });

                log.run(
                    () => {
                        log.run(
                            () => {
                                log.info(["inner"]);
                            },
                            { metadata: { b: 2 } },
                        );
                        log.info(["outer"]);
                    },
                    { metadata: { a: 1 } },
                );

                const [inner, outer] = logSpy.mock.calls.map(([data]) => {
                    return data;
                });
                expect(inner?.metadata).toStrictEqual({ a: 1, b: 2 });
                expect(outer?.metadata).toStrictEqual({ a: 1 });
            });

            test("Should let inner metadata override an outer key", () => {
                const transport = new NoOpLogTransport();
                const logSpy = vi.spyOn(transport, "log");
                const log = new Log({
                    transport,
                    executionContext: new ExecutionContext(
                        new AlsExecutionContextAdapter(),
                    ),
                });

                log.run(
                    () => {
                        log.run(
                            () => {
                                log.info(["inner"]);
                            },
                            { metadata: { a: 2 } },
                        );
                    },
                    { metadata: { a: 1 } },
                );

                const entry = logSpy.mock.calls[0]?.[0];
                expect(entry?.metadata).toStrictEqual({ a: 2 });
            });
        });

        describe("group", () => {
            test("Should attach the group to entries logged while it runs", () => {
                const transport = new NoOpLogTransport();
                const logSpy = vi.spyOn(transport, "log");
                const log = new Log({
                    transport,
                    executionContext: new ExecutionContext(
                        new AlsExecutionContextAdapter(),
                    ),
                });

                log.run(
                    () => {
                        log.info(["inside"]);
                    },
                    { group: "auth" },
                );

                const entry = logSpy.mock.calls[0]?.[0];
                expect(entry?.group).toBe("auth");
            });

            test("Should not attach the group to entries logged after it returns", () => {
                const transport = new NoOpLogTransport();
                const logSpy = vi.spyOn(transport, "log");
                const log = new Log({
                    transport,
                    executionContext: new ExecutionContext(
                        new AlsExecutionContextAdapter(),
                    ),
                });

                log.run(() => {}, { group: "auth" });
                log.info(["after"]);

                const entry = logSpy.mock.calls[0]?.[0];
                expect(entry?.group).toBeUndefined();
            });

            test("Should restore the outer group after a nested group", () => {
                const transport = new NoOpLogTransport();
                const logSpy = vi.spyOn(transport, "log");
                const log = new Log({
                    transport,
                    executionContext: new ExecutionContext(
                        new AlsExecutionContextAdapter(),
                    ),
                });

                log.run(
                    () => {
                        log.run(
                            () => {
                                log.info(["inner"]);
                            },
                            { group: "db" },
                        );
                        log.info(["outer"]);
                    },
                    { group: "auth" },
                );

                const [inner, outer] = logSpy.mock.calls.map(([data]) => {
                    return data;
                });
                expect(inner?.group).toBe("db");
                expect(outer?.group).toBe("auth");
            });
        });

        test("Should attach the span, the metadata and the group to the same entry", () => {
            const transport = new NoOpLogTransport();
            const logSpy = vi.spyOn(transport, "log");
            const log = new Log({
                transport,
                executionContext: new ExecutionContext(
                    new AlsExecutionContextAdapter(),
                ),
            });

            log.run(
                () => {
                    log.info(["inside"]);
                },
                { group: "auth", metadata: { requestId: "r1" }, span: "db" },
            );

            const entry = logSpy.mock.calls[0]?.[0];
            expect(entry?.group).toBe("auth");
            expect(entry?.metadata).toStrictEqual({ requestId: "r1" });
            expect(entry?.spans?.["db"]).toBeInstanceOf(TimeSpan);
        });

        test("Should return the value of the invocable", () => {
            const transport = new NoOpLogTransport();
            const log = new Log({ transport });

            const result = log.run(
                () => {
                    return { id: "42" };
                },
                { group: "auth", metadata: { a: 1 }, span: "load" },
            );

            expect(result).toStrictEqual({ id: "42" });
        });

        test("Should return the value of an async invocable", async () => {
            const transport = new NoOpLogTransport();
            const log = new Log({ transport });

            const result = await log.run(() => {
                return Promise.resolve("value");
            });

            expect(result).toBe("value");
        });

        test("Should propagate a synchronous error", () => {
            const transport = new NoOpLogTransport();
            const log = new Log({ transport });
            const error = new Error("failed");

            expect(() => {
                log.run(() => {
                    throw error;
                });
            }).toThrow(error);
        });

        test("Should propagate a rejection", async () => {
            const transport = new NoOpLogTransport();
            const log = new Log({ transport });
            const error = new Error("failed");

            await expect(
                log.run(() => {
                    return Promise.reject(error);
                }),
            ).rejects.toBe(error);
        });
    });

    describe("method: putMetadata", () => {
        test("Should merge the values into the current scope", () => {
            const transport = new NoOpLogTransport();
            const logSpy = vi.spyOn(transport, "log");
            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            const log = new Log({ transport, executionContext });

            executionContext.run(() => {
                log.putMetadata({ requestId: "r1" });
                log.info(["inside"]);
            });

            const entry = logSpy.mock.calls[0]?.[0];
            expect(entry?.metadata).toStrictEqual({ requestId: "r1" });
        });

        test("Should not restore the values after the scope ends", () => {
            const transport = new NoOpLogTransport();
            const logSpy = vi.spyOn(transport, "log");
            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            const log = new Log({ transport, executionContext });

            executionContext.run(() => {
                log.putMetadata({ requestId: "r1" });
            });
            executionContext.run(() => {
                log.info(["after"]);
            });

            const entry = logSpy.mock.calls[0]?.[0];
            expect(entry?.metadata).toBeUndefined();
        });

        test("Should merge a single key-value pair into the current scope", () => {
            const transport = new NoOpLogTransport();
            const logSpy = vi.spyOn(transport, "log");
            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            const log = new Log({ transport, executionContext });

            executionContext.run(() => {
                log.putMetadata("requestId", "r1");
                log.info(["inside"]);
            });

            const entry = logSpy.mock.calls[0]?.[0];
            expect(entry?.metadata).toStrictEqual({ requestId: "r1" });
        });

        test("Should override an existing key with a single key-value pair", () => {
            const transport = new NoOpLogTransport();
            const logSpy = vi.spyOn(transport, "log");
            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            const log = new Log({ transport, executionContext });

            executionContext.run(() => {
                log.putMetadata({ requestId: "r1" });
                log.putMetadata("requestId", "r2");
                log.info(["inside"]);
            });

            const entry = logSpy.mock.calls[0]?.[0];
            expect(entry?.metadata).toStrictEqual({ requestId: "r2" });
        });

        test("Should merge with the metadata of the enclosing run scope", () => {
            const transport = new NoOpLogTransport();
            const logSpy = vi.spyOn(transport, "log");
            const log = new Log({
                transport,
                executionContext: new ExecutionContext(
                    new AlsExecutionContextAdapter(),
                ),
            });

            log.run(
                () => {
                    log.putMetadata({ b: 2 });
                    log.info(["inside"]);
                },
                { metadata: { a: 1 } },
            );

            const entry = logSpy.mock.calls[0]?.[0];
            expect(entry?.metadata).toStrictEqual({ a: 1, b: 2 });
        });
    });

    describe("extra info", () => {
        test("Should attach the group and the metadata to the entry", () => {
            const transport = new NoOpLogTransport();
            const logSpy = vi.spyOn(transport, "log");
            const log = new Log({ transport });

            log.info(["signed in"], {
                group: "auth",
                metadata: { userId: "42" },
            });

            const entry = logSpy.mock.calls[0]?.[0];
            expect(entry?.group).toBe("auth");
            expect(entry?.metadata).toStrictEqual({ userId: "42" });
        });

        test("Should merge the metadata over the metadata of the run scope", () => {
            const transport = new NoOpLogTransport();
            const logSpy = vi.spyOn(transport, "log");
            const log = new Log({
                transport,
                executionContext: new ExecutionContext(
                    new AlsExecutionContextAdapter(),
                ),
            });

            log.run(
                () => {
                    log.info(["inside"], { metadata: { route: "/b" } });
                },
                { metadata: { requestId: "r1", route: "/a" } },
            );

            const entry = logSpy.mock.calls[0]?.[0];
            expect(entry?.metadata).toStrictEqual({
                requestId: "r1",
                route: "/b",
            });
        });

        test("Should let the group of the entry override the group of the run scope", () => {
            const transport = new NoOpLogTransport();
            const logSpy = vi.spyOn(transport, "log");
            const log = new Log({
                transport,
                executionContext: new ExecutionContext(
                    new AlsExecutionContextAdapter(),
                ),
            });

            log.run(
                () => {
                    log.info(["inside"], { group: "custom" });
                },
                { group: "auth" },
            );

            const entry = logSpy.mock.calls[0]?.[0];
            expect(entry?.group).toBe("custom");
        });

        test("Should attach the error details on a failure level", () => {
            const transport = new NoOpLogTransport();
            const logSpy = vi.spyOn(transport, "log");
            const log = new Log({ transport });
            const error = new Error("card_declined");

            log.error(["payment failed"], {
                metadata: { orderId: "o-1" },
                error,
            });

            const entry = logSpy.mock.calls[0]?.[0];
            expect(entry?.messages).toStrictEqual(["payment failed"]);
            expect(entry?.metadata).toStrictEqual({ orderId: "o-1" });
            expect(entry?.error).toBe(error);
        });
    });

    describe("without an execution context", () => {
        test("Should attach no metadata and no spans to a plain entry", () => {
            const transport = new NoOpLogTransport();
            const logSpy = vi.spyOn(transport, "log");
            const log = new Log({ transport });

            log.info(["plain"]);

            const entry = logSpy.mock.calls[0]?.[0];
            expect(entry?.messages).toStrictEqual(["plain"]);
            expect(entry?.metadata).toBeUndefined();
            expect(entry?.spans).toBeUndefined();
            expect(entry?.group).toBeUndefined();
            expect(entry?.error).toBeUndefined();
        });

        test("Should not attach a span because the context keeps no state", () => {
            const transport = new NoOpLogTransport();
            const logSpy = vi.spyOn(transport, "log");
            const log = new Log({ transport });

            log.run(
                () => {
                    log.info(["inside"]);
                },
                { group: "auth", metadata: { a: 1 }, span: "db" },
            );

            const entry = logSpy.mock.calls[0]?.[0];
            expect(entry?.spans).toBeUndefined();
            expect(entry?.metadata).toBeUndefined();
            expect(entry?.group).toBeUndefined();
        });
    });

    describe("custom tokens", () => {
        test("Should keep logs with different metadata tokens isolated", () => {
            const executionContext = new ExecutionContext(
                new AlsExecutionContextAdapter(),
            );
            const transport = new NoOpLogTransport();
            const logSpy = vi.spyOn(transport, "log");
            const first = new Log({
                transport,
                executionContext,
                metadataToken: contextToken<LogMetadata>("first.metadata"),
            });
            const second = new Log({
                transport,
                executionContext,
                metadataToken: contextToken<LogMetadata>("second.metadata"),
            });

            executionContext.run(() => {
                first.putMetadata({ requestId: "r1" });
                first.info(["first"]);
                second.info(["second"]);
            });

            const [firstEntry, secondEntry] = logSpy.mock.calls.map(
                ([data]) => {
                    return data;
                },
            );
            expect(firstEntry?.metadata).toStrictEqual({ requestId: "r1" });
            expect(secondEntry?.metadata).toBeUndefined();
        });
    });
});
