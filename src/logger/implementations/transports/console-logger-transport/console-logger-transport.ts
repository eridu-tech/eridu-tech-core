/**
 * @module Observability
 */

import { LOG_LEVEL } from "@/logger/contracts/_module-exports.js";

import type {
    ILoggerTransport,
    LogData,
} from "@/logger/contracts/_module-exports.js";

/**
 * Writes entries to the JavaScript console.
 *
 * Each level maps to its console counterpart, with `error` and `fatal` both
 * using `console.error` and `verbose` using `console.trace`. `loggedAt` is
 * rendered as a `Date` and spans in milliseconds.
 *
 * IMPORT_PATH: `"eridu-tech/logger/console-logger-transport"`
 * @group Transports
 */
export class ConsoleLoggerTransport implements ILoggerTransport {
    log(data: LogData): void {
        const { spans, loggedAt, ...rest } = data;
        const newSpans = Object.fromEntries(
            Object.entries(spans)
                .map(([key, value]) => {
                    return [key, value?.toMilliseconds()] as const;
                })
                .filter(([_key, value]) => {
                    return value !== undefined;
                }),
        );

        const newData = {
            ...rest,
            loggedAt: new Date(loggedAt),
            spans: newSpans,
        };

        if (rest.level === LOG_LEVEL.DEBUG) {
            console.debug(newData);
        }
        if (rest.level === LOG_LEVEL.ERROR) {
            console.error(newData);
        }
        if (rest.level === LOG_LEVEL.FATAL) {
            console.error(newData);
        }
        if (rest.level === LOG_LEVEL.INFO) {
            console.info(newData);
        }
        if (rest.level === LOG_LEVEL.VERBOSE) {
            console.trace(newData);
        }
        if (rest.level === LOG_LEVEL.WARN) {
            console.warn(newData);
        }
    }
}
