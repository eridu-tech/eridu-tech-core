import { afterEach, describe, expect, test, vi } from "vitest";

import { LOG_LEVEL } from "@/logger/contracts/_module-exports.js";
import { ConsoleLoggerTransport } from "@/logger/implementations/transports/console-logger-transport/_module-exports.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";

import type { MockInstance } from "vitest";

import type { LogData } from "@/logger/contracts/_module-exports.js";

const LOGGED_AT = 1_700_000_000_000;

type ConsoleMethod = "debug" | "info" | "warn" | "error" | "trace";

type ConsoleSpy = MockInstance<(...data: Array<unknown>) => void>;

function makeLogData(overrides: Partial<LogData> = {}): LogData {
    return {
        level: LOG_LEVEL.INFO,
        loggedAt: LOGGED_AT,
        messages: ["hello"],
        metadata: {},
        spans: {},
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

describe("class: ConsoleLoggerTransport", () => {
    afterEach(() => {
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

                new ConsoleLoggerTransport().log(makeLogData({ level }));

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

            new ConsoleLoggerTransport().log(
                makeLogData({ messages, metadata }),
            );

            expect(consoleSpy.info).toHaveBeenLastCalledWith({
                level: LOG_LEVEL.INFO,
                loggedAt: new Date(LOGGED_AT),
                messages,
                metadata,
                spans: {},
            });
        });

        test("Should convert loggedAt into a Date", () => {
            const consoleSpy = spyOnConsoleMethods();

            new ConsoleLoggerTransport().log(makeLogData());

            expect(consoleSpy.info).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    loggedAt: new Date(LOGGED_AT),
                }),
            );
        });

        test("Should convert spans into milliseconds", () => {
            const consoleSpy = spyOnConsoleMethods();

            new ConsoleLoggerTransport().log(
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

            new ConsoleLoggerTransport().log(makeLogData({ spans: {} }));

            expect(consoleSpy.info).toHaveBeenLastCalledWith(
                expect.objectContaining({ spans: {} }),
            );
        });
    });
});
