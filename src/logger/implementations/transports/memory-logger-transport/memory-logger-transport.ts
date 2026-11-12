/**
 * @module Logger
 */

import type { ReadonlyDeep } from "type-fest";

import type {
    ILoggerTransport,
    LogData,
} from "@/logger/contracts/_module-exports.js";

/**
 * Stores every entry in memory.
 *
 * Useful in tests to assert on the entries a logger produced.
 *
 * IMPORT_PATH: `"eridu-tech/logger/memory-logger-transport"`
 * @group Transports
 */
export class MemoryLoggerTransport implements ILoggerTransport {
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
