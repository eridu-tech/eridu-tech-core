/**
 * @module Observability
 */

import type {
    ILoggerTransport,
    LogData,
} from "@/logger/contracts/_module-exports.js";

/**
 * Drops every entry.
 *
 * Useful when logging is switched off or in tests.
 *
 * IMPORT_PATH: `"eridu-tech/logger/no-op-logger-transport"`
 * @group Transports
 */
export class NoOpLoggerTransport implements ILoggerTransport {
    log(_data: LogData): void {}
}
