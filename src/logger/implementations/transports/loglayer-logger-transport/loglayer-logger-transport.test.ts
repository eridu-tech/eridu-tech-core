import { BlankTransport, LogLayer } from "loglayer";
import { beforeEach, describe, expect, test } from "vitest";

import { LOG_LEVEL } from "@/logger/contracts/_module-exports.js";
import { LogLayerLoggerTransport } from "@/logger/implementations/transports/loglayer-logger-transport/_module-exports.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";

import type { LogLayerTransportParams } from "loglayer";

import type { LogData } from "@/logger/contracts/_module-exports.js";

const LOGGED_AT = 1_700_000_000_000;

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

describe("class: LogLayerLoggerTransport", () => {
    let captured: Array<LogLayerTransportParams>;
    let logger: LogLayer;
    let transport: LogLayerLoggerTransport;

    beforeEach(() => {
        captured = [];
        logger = new LogLayer({
            transport: new BlankTransport({
                shipToLogger: (params) => {
                    captured.push(params);
                    return [];
                },
            }),
        });
        transport = new LogLayerLoggerTransport({ logger });
    });

    test.each([
        { level: LOG_LEVEL.DEBUG, logLayerLevel: "debug" },
        { level: LOG_LEVEL.VERBOSE, logLayerLevel: "trace" },
        { level: LOG_LEVEL.INFO, logLayerLevel: "info" },
        { level: LOG_LEVEL.WARN, logLayerLevel: "warn" },
        { level: LOG_LEVEL.ERROR, logLayerLevel: "error" },
        { level: LOG_LEVEL.FATAL, logLayerLevel: "fatal" },
    ] as const)(
        "Should write $level entries at the $logLayerLevel LogLayer level",
        ({ level, logLayerLevel }) => {
            transport.log(makeLogData({ level }));

            expect(captured).toHaveLength(1);
            expect(captured[0]?.logLevel).toBe(logLayerLevel);
        },
    );

    test("Should pass messages through unchanged", () => {
        const messages = ["hello", 42, true, null, undefined, { first: "x" }];
        transport.log(makeLogData({ messages }));

        expect(captured[0]?.messages).toEqual(messages);
    });

    test("Should forward the entry only once", () => {
        transport.log(makeLogData());

        expect(captured).toHaveLength(1);
    });

    test("Should attach metadata, loggedAt, and spans to the entry", () => {
        transport.log(
            makeLogData({
                metadata: { requestId: "abc" },
                spans: {
                    db: TimeSpan.fromMilliseconds(12),
                    http: TimeSpan.fromMilliseconds(250),
                },
            }),
        );

        expect(captured[0]?.metadata).toEqual({
            requestId: "abc",
            loggedAt: new Date(LOGGED_AT),
            spans: { db: 12, http: 250 },
        });
    });

    test("Should output an empty spans object when there are no spans", () => {
        transport.log(makeLogData({ spans: {} }));

        expect(captured[0]?.metadata).toEqual({
            loggedAt: new Date(LOGGED_AT),
            spans: {},
        });
    });

    test("Should omit loggedAt when includeLoggedAt is false", () => {
        transport = new LogLayerLoggerTransport({
            logger,
            includeLoggedAt: false,
        });

        transport.log(makeLogData({ spans: {} }));

        expect(captured[0]?.metadata).toEqual({ spans: {} });
    });
});
