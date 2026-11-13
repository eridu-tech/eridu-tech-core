/**
 * @module Logger
 */

import type { ReadonlyDeep } from "type-fest";

import type {
    ILogTransport,
    LogData,
} from "@/log/contracts/_module-exports.js";

/**
 * Stores every entry in memory.
 *
 * Useful in tests to assert on the entries a log produced.
 *
 * IMPORT_PATH: `"eridu-tech/logger/memory-log-transport"`
 * @group Transports
 */
export class MemoryLogTransport implements ILogTransport {
    private readonly logEntries: Array<LogData> = [];

    /**
     * Entries received so far, in the order they were logged.
     */
    get entries(): ReadonlyArray<ReadonlyDeep<LogData>> {
        return this.logEntries;
    }

    log(data: LogData): void {
        this.logEntries.push(data);
    }

    /**
     * Removes every stored entry.
     */
    clear(): void {
        this.logEntries.length = 0;
    }
}
