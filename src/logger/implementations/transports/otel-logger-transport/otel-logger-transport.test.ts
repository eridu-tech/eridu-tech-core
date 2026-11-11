import { SeverityNumber } from "@opentelemetry/api";
import {
    InMemoryLogRecordExporter,
    LoggerProvider,
    SimpleLogRecordProcessor,
} from "@opentelemetry/sdk-logs";
import { beforeEach, describe, expect, test } from "vitest";

import { LOG_LEVEL } from "@/logger/contracts/_module-exports.js";
import { OtelLoggerTransport } from "@/logger/implementations/transports/otel-logger-transport/_module-exports.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";

import type { Logger } from "@opentelemetry/api";

import type { LogData, LogSpans } from "@/logger/contracts/_module-exports.js";

const LOGGED_AT = 1_700_000_000_000;

function makeLogData(overrides: Partial<LogData> = {}): LogData {
    return {
        level: LOG_LEVEL.INFO,
        loggedAt: LOGGED_AT,
        messages: ["hello"],
        ...overrides,
    };
}

describe("class: OtelLoggerTransport", () => {
    let exporter: InMemoryLogRecordExporter;
    let logger: Logger;
    let transport: OtelLoggerTransport;

    beforeEach(() => {
        exporter = new InMemoryLogRecordExporter();
        const provider = new LoggerProvider({
            processors: [
                new SimpleLogRecordProcessor({
                    exporter,
                }),
            ],
        });
        logger = provider.getLogger("test");
        transport = new OtelLoggerTransport({ logger });
    });

    function getRecords() {
        return exporter.getFinishedLogRecords();
    }

    test.each([
        {
            level: LOG_LEVEL.DEBUG,
            severityNumber: SeverityNumber.DEBUG,
            severityText: "debug",
        },
        {
            level: LOG_LEVEL.VERBOSE,
            severityNumber: SeverityNumber.TRACE,
            severityText: "verbose",
        },
        {
            level: LOG_LEVEL.INFO,
            severityNumber: SeverityNumber.INFO,
            severityText: "info",
        },
        {
            level: LOG_LEVEL.WARN,
            severityNumber: SeverityNumber.WARN,
            severityText: "warn",
        },
        {
            level: LOG_LEVEL.ERROR,
            severityNumber: SeverityNumber.ERROR,
            severityText: "error",
        },
        {
            level: LOG_LEVEL.FATAL,
            severityNumber: SeverityNumber.FATAL,
            severityText: "fatal",
        },
    ] as const)(
        "Should write $level entries with severity $severityText",
        ({ level, severityNumber, severityText }) => {
            transport.log(makeLogData({ level }));

            const records = getRecords();
            expect(records).toHaveLength(1);
            expect(records[0]?.severityNumber).toBe(severityNumber);
            expect(records[0]?.severityText).toBe(severityText);
        },
    );

    test("Should pass messages through unchanged as the body", () => {
        const messages = ["hello", 42, true, null, undefined, { first: "x" }];
        transport.log(makeLogData({ messages }));

        expect(getRecords()[0]?.body).toEqual(messages);
    });

    test("Should forward the entry only once", () => {
        transport.log(makeLogData());

        expect(getRecords()).toHaveLength(1);
    });

    test("Should attach metadata and spans as attributes", () => {
        transport.log(
            makeLogData({
                metadata: { requestId: "abc" },
                spans: {
                    db: TimeSpan.fromMilliseconds(12),
                    http: TimeSpan.fromMilliseconds(250),
                },
            }),
        );

        expect(getRecords()[0]?.attributes).toEqual({
            metadata: { requestId: "abc" },
            spans: { db: 12, http: 250 },
        });
    });

    test("Should attach the group as an attribute", () => {
        transport.log(makeLogData({ group: "auth" }));

        expect(getRecords()[0]?.attributes).toEqual({ group: "auth" });
    });

    test("Should attach the error as an attribute", () => {
        const error = { reason: "card_declined" };
        transport.log(makeLogData({ error, level: LOG_LEVEL.ERROR }));

        expect(getRecords()[0]?.attributes).toEqual({ error });
    });

    test("Should output an empty spans object when there are no spans", () => {
        transport.log(makeLogData({ spans: {} }));

        expect(getRecords()[0]?.attributes).toEqual({ spans: {} });
    });

    test("Should omit the spans attribute when the entry has none", () => {
        transport.log(makeLogData());

        expect(getRecords()[0]?.attributes).toEqual({});
    });

    test("Should drop spans without a value", () => {
        const spans: LogSpans = {
            db: undefined,
            http: TimeSpan.fromMilliseconds(5),
        };
        transport.log(makeLogData({ spans }));

        expect(getRecords()[0]?.attributes).toEqual({ spans: { http: 5 } });
    });
});
