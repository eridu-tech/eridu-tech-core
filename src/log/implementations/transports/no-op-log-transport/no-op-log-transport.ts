/**
 * @module Log
 */

import type {
    ILogTransport,
    LogData,
} from "@/log/contracts/_module-exports.js";

/**
 * Drops every entry.
 *
 * Useful when logging is switched off or in tests.
 *
 * IMPORT_PATH: `"eridu-tech/log/no-op-log-transport"`
 * @group Transports
 */
export class NoOpLogTransport implements ILogTransport {
    log(_data: LogData): void {}
}
