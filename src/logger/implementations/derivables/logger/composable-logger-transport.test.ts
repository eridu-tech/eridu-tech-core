import { afterEach, describe, expect, test, vi } from "vitest";

import { LOG_LEVEL } from "@/logger/contracts/_module-exports.js";
import { ComposableLoggerTransport } from "@/logger/implementations/derivables/logger/composable-logger-transport.js";
import { NoOpLoggerTransport } from "@/logger/implementations/transports/no-op-logger-transport/_module-exports.js";

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

describe("class: ComposableLoggerTransport", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    test("Should forward to a single transport", () => {
        const loggerTransport = new NoOpLoggerTransport();
        const log = vi.spyOn(loggerTransport, "log");
        const transport = new ComposableLoggerTransport(loggerTransport);
        const data = makeLogData();

        transport.log(data);

        expect(log).toHaveBeenCalledExactlyOnceWith(data);
    });

    test("Should forward to every transport in the configured order", () => {
        const firstTransport = new NoOpLoggerTransport();
        const firstLog = vi.spyOn(firstTransport, "log");
        const secondTransport = new NoOpLoggerTransport();
        const secondLog = vi.spyOn(secondTransport, "log");
        const transport = new ComposableLoggerTransport([
            firstTransport,
            secondTransport,
        ]);
        const data = makeLogData();

        transport.log(data);

        expect(firstLog).toHaveBeenCalledExactlyOnceWith(data);
        expect(secondLog).toHaveBeenCalledExactlyOnceWith(data);
        const firstOrder = firstLog.mock.invocationCallOrder[0];
        const secondOrder = secondLog.mock.invocationCallOrder[0];
        expect(firstOrder).toBeLessThan(secondOrder as number);
    });

    test("Should forward every entry and every level to all transports", () => {
        const firstTransport = new NoOpLoggerTransport();
        const firstLog = vi.spyOn(firstTransport, "log");
        const secondTransport = new NoOpLoggerTransport();
        const secondLog = vi.spyOn(secondTransport, "log");
        const transport = new ComposableLoggerTransport([
            firstTransport,
            secondTransport,
        ]);
        const debugData = makeLogData({
            level: LOG_LEVEL.DEBUG,
            messages: ["debug"],
        });
        const fatalData = makeLogData({
            level: LOG_LEVEL.FATAL,
            messages: ["fatal"],
        });

        transport.log(debugData);
        transport.log(fatalData);

        expect(firstLog).toHaveBeenNthCalledWith(1, debugData);
        expect(firstLog).toHaveBeenNthCalledWith(2, fatalData);
        expect(secondLog).toHaveBeenNthCalledWith(1, debugData);
        expect(secondLog).toHaveBeenNthCalledWith(2, fatalData);
    });
});
