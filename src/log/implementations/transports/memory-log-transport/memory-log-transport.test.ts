import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { LOG_LEVEL } from "@/log/contracts/_module-exports.js";
import { Log } from "@/log/implementations/derivables/_module-exports.js";
import { MemoryLogTransport } from "@/log/implementations/transports/memory-log-transport/_module-exports.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";

import type { LogData } from "@/log/contracts/_module-exports.js";

const LOGGED_AT = 1_700_000_000_000;

function makeLogData(overrides: Partial<LogData> = {}): LogData {
    return {
        level: LOG_LEVEL.INFO,
        loggedAt: LOGGED_AT,
        messages: ["hello"],
        ...overrides,
    };
}

describe("class: MemoryLogTransport", () => {
    beforeEach(() => {
        vi.useFakeTimers({ now: LOGGED_AT, toFake: ["Date", "performance"] });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    test("Should start with no entries", () => {
        const transport = new MemoryLogTransport();

        expect(transport.entries).toEqual([]);
    });

    test("Should store the entry", () => {
        const transport = new MemoryLogTransport();
        const data = makeLogData();

        transport.log(data);

        expect(transport.entries).toEqual([data]);
    });

    test("Should store entries in the order they were logged", () => {
        const transport = new MemoryLogTransport();
        const first = makeLogData({ messages: ["first"] });
        const second = makeLogData({ messages: ["second"] });

        transport.log(first);
        transport.log(second);

        expect(transport.entries).toStrictEqual([first, second]);
    });

    test("Should keep every field of the entry", () => {
        const transport = new MemoryLogTransport();
        const error = new Error("boom");
        const data = makeLogData({
            group: "auth",
            metadata: { requestId: "r1" },
            error,
            spans: { db: TimeSpan.fromMilliseconds(12) },
        });

        transport.log(data);

        expect(transport.entries[0]).toBe(data);
    });

    test("Should store entries logged through a Log", () => {
        const transport = new MemoryLogTransport();
        const log = new Log({ transport });

        log.info(["hello"]);

        expect(transport.entries).toHaveLength(1);
        expect(transport.entries[0]?.level).toBe(LOG_LEVEL.INFO);
        expect(transport.entries[0]?.messages).toEqual(["hello"]);
        expect(transport.entries[0]?.loggedAt).toBe(LOGGED_AT);
    });

    test("Should clear every stored entry", () => {
        const transport = new MemoryLogTransport();
        transport.log(makeLogData());

        transport.clear();

        expect(transport.entries).toEqual([]);
    });
});
