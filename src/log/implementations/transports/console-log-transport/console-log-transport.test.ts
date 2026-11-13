import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { LOG_LEVEL } from "@/log/contracts/_module-exports.js";
import { ConsoleLogTransport } from "@/log/implementations/transports/console-log-transport/_module-exports.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";

import type { MockInstance } from "vitest";

import type { LogData, LogSpans } from "@/log/contracts/_module-exports.js";

const LOGGED_AT = 1_700_000_000_000;

type ConsoleMethod = "debug" | "info" | "warn" | "error" | "trace";

type ConsoleSpy = MockInstance<(...data: Array<unknown>) => void>;

function makeLogData(overrides: Partial<LogData> = {}): LogData {
    return {
        level: LOG_LEVEL.INFO,
        loggedAt: LOGGED_AT,
        messages: ["hello"],
        ...overrides,
    };
}

function spyOnConsoleMethods(): Record<ConsoleMethod, ConsoleSpy> {
    return {
        debug: vi.spyOn(console, "debug").mockImplementation(() => {}),
        info: vi.spyOn(console, "info").mockImplementation(() => {}),
        warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
        error: vi.spyOn(console, "error").mockImplementation(() => {}),
        trace: vi.spyOn(console, "trace").mockImplementation(() => {}),
    };
}

describe("class: ConsoleLogTransport", () => {
    beforeEach(() => {
        vi.useFakeTimers({ now: LOGGED_AT, toFake: ["Date", "performance"] });
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    describe("method: log", () => {
        test.each([
            { level: LOG_LEVEL.DEBUG, consoleMethod: "debug" },
            { level: LOG_LEVEL.VERBOSE, consoleMethod: "trace" },
            { level: LOG_LEVEL.INFO, consoleMethod: "info" },
            { level: LOG_LEVEL.WARN, consoleMethod: "warn" },
            { level: LOG_LEVEL.ERROR, consoleMethod: "error" },
            { level: LOG_LEVEL.FATAL, consoleMethod: "error" },
        ] as const)(
            "Should write $level entries with console.$consoleMethod",
            ({ level, consoleMethod }) => {
                const consoleSpy = spyOnConsoleMethods();

                new ConsoleLogTransport().log(makeLogData({ level }));

                expect(consoleSpy[consoleMethod]).toHaveBeenCalledTimes(1);

                const otherMethods = (
                    ["debug", "info", "warn", "error", "trace"] as const
                ).filter((method) => {
                    return method !== consoleMethod;
                });
                for (const otherMethod of otherMethods) {
                    expect(consoleSpy[otherMethod]).not.toHaveBeenCalled();
                }
            },
        );

        test("Should pass messages, metadata, and level through unchanged", () => {
            const consoleSpy = spyOnConsoleMethods();
            const messages = ["first", { second: true }];
            const metadata = { requestId: "abc" };

            new ConsoleLogTransport().log(makeLogData({ messages, metadata }));

            expect(consoleSpy.info).toHaveBeenLastCalledWith({
                level: LOG_LEVEL.INFO,
                loggedAt: new Date(LOGGED_AT),
                messages,
                metadata,
            });
        });

        test("Should pass the group through unchanged", () => {
            const consoleSpy = spyOnConsoleMethods();

            new ConsoleLogTransport().log(makeLogData({ group: "auth" }));

            expect(consoleSpy.info).toHaveBeenLastCalledWith(
                expect.objectContaining({ group: "auth" }),
            );
        });

        test("Should pass the error through unchanged", () => {
            const consoleSpy = spyOnConsoleMethods();
            const error = new Error("card_declined");

            new ConsoleLogTransport().log(
                makeLogData({ error, level: LOG_LEVEL.ERROR }),
            );

            expect(consoleSpy.error).toHaveBeenLastCalledWith(
                expect.objectContaining({ error }),
            );
        });

        test("Should pass the error of every failure level", () => {
            const consoleSpy = spyOnConsoleMethods();
            const error = new Error("boom");

            new ConsoleLogTransport().log(
                makeLogData({ error, level: LOG_LEVEL.WARN }),
            );
            new ConsoleLogTransport().log(
                makeLogData({ error, level: LOG_LEVEL.ERROR }),
            );
            new ConsoleLogTransport().log(
                makeLogData({ error, level: LOG_LEVEL.FATAL }),
            );

            expect(consoleSpy.warn).toHaveBeenLastCalledWith(
                expect.objectContaining({ error }),
            );
            expect(consoleSpy.error).toHaveBeenCalledTimes(2);
            expect(consoleSpy.error).toHaveBeenNthCalledWith(
                1,
                expect.objectContaining({ error }),
            );
            expect(consoleSpy.error).toHaveBeenNthCalledWith(
                2,
                expect.objectContaining({ error }),
            );
        });

        test("Should pass a non-Error value through", () => {
            const consoleSpy = spyOnConsoleMethods();

            new ConsoleLogTransport().log(
                makeLogData({ error: "declined", level: LOG_LEVEL.ERROR }),
            );

            expect(consoleSpy.error).toHaveBeenLastCalledWith(
                expect.objectContaining({ error: "declined" }),
            );
        });

        test("Should pass a null error through", () => {
            const consoleSpy = spyOnConsoleMethods();

            new ConsoleLogTransport().log(
                makeLogData({ error: null, level: LOG_LEVEL.ERROR }),
            );

            expect(consoleSpy.error).toHaveBeenLastCalledWith(
                expect.objectContaining({ error: null }),
            );
        });

        test("Should omit the group and the error when they are not present", () => {
            const consoleSpy = spyOnConsoleMethods();

            new ConsoleLogTransport().log(makeLogData());

            const [output] = consoleSpy.info.mock.calls[0] as [object];
            expect(output).not.toHaveProperty("group");
            expect(output).not.toHaveProperty("error");
            expect(output).not.toHaveProperty("metadata");
        });

        test("Should convert loggedAt into a Date", () => {
            const consoleSpy = spyOnConsoleMethods();

            new ConsoleLogTransport().log(makeLogData());

            expect(consoleSpy.info).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    loggedAt: new Date(LOGGED_AT),
                }),
            );
        });

        test("Should convert spans into milliseconds", () => {
            const consoleSpy = spyOnConsoleMethods();

            new ConsoleLogTransport().log(
                makeLogData({
                    spans: {
                        db: TimeSpan.fromMilliseconds(12),
                        http: TimeSpan.fromMilliseconds(250),
                    },
                }),
            );

            expect(consoleSpy.info).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    spans: { db: 12, http: 250 },
                }),
            );
        });

        test("Should output an empty spans object when there are no spans", () => {
            const consoleSpy = spyOnConsoleMethods();

            new ConsoleLogTransport().log(makeLogData({ spans: {} }));

            expect(consoleSpy.info).toHaveBeenLastCalledWith(
                expect.objectContaining({ spans: {} }),
            );
        });

        test("Should omit the spans when the entry has none", () => {
            const consoleSpy = spyOnConsoleMethods();

            new ConsoleLogTransport().log(makeLogData());

            const [output] = consoleSpy.info.mock.calls[0] as [object];
            expect(output).not.toHaveProperty("spans");
        });

        test("Should drop spans without a value", () => {
            const consoleSpy = spyOnConsoleMethods();

            new ConsoleLogTransport().log(
                makeLogData({
                    spans: {
                        db: undefined,
                        http: TimeSpan.fromMilliseconds(5),
                    },
                }),
            );

            expect(consoleSpy.info).toHaveBeenLastCalledWith(
                expect.objectContaining({ spans: { http: 5 } }),
            );
        });

        test("Should output the whole entry when every optional field is set", () => {
            const consoleSpy = spyOnConsoleMethods();
            const messages = ["failed", { orderId: "o-1" }];
            const metadata = { requestId: "abc" };
            const error = new Error("boom");
            const spans: LogSpans = { db: TimeSpan.fromMilliseconds(12) };

            new ConsoleLogTransport().log(
                makeLogData({
                    level: LOG_LEVEL.ERROR,
                    group: "payments",
                    messages,
                    metadata,
                    error,
                    spans,
                }),
            );

            expect(consoleSpy.error).toHaveBeenLastCalledWith({
                level: LOG_LEVEL.ERROR,
                group: "payments",
                loggedAt: new Date(LOGGED_AT),
                messages,
                metadata,
                error,
                spans: { db: 12 },
            });
        });

        test("Should forward the group at any level", () => {
            const consoleSpy = spyOnConsoleMethods();

            new ConsoleLogTransport().log(
                makeLogData({ group: "auth", level: LOG_LEVEL.WARN }),
            );

            expect(consoleSpy.warn).toHaveBeenLastCalledWith(
                expect.objectContaining({ group: "auth" }),
            );
        });

        test("Should not mutate the entry", () => {
            const spans: LogSpans = { db: TimeSpan.fromMilliseconds(12) };
            const data = makeLogData({
                error: new Error("boom"),
                group: "auth",
                spans,
            });

            new ConsoleLogTransport().log(data);

            expect(data.spans).toBe(spans);
            expect(data.spans?.["db"]).toBeInstanceOf(TimeSpan);
            expect(data.group).toBe("auth");
            expect(data.error).toBeInstanceOf(Error);
        });
    });
});
