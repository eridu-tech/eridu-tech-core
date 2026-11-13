/**
 * @module Logger
 */

import { LOG_LEVEL } from "@/log/contracts/_module-exports.js";

import type {
    AllLogLevels,
    ILogTransport,
    LogData,
    LogSpans,
} from "@/log/contracts/_module-exports.js";

/**
 * Writes entries to the JavaScript console.
 *
 * Each level maps to its console counterpart, with `error` and `fatal` both
 * using `console.error` and `verbose` using `console.trace`. `loggedAt` is
 * rendered as a `Date` and spans in milliseconds.
 *
 * IMPORT_PATH: `"eridu-tech/log/console-log-transport"`
 * @group Transports
 */
export class ConsoleLogTransport implements ILogTransport {
    private logToConsole(level: AllLogLevels, data: unknown) {
        if (level === LOG_LEVEL.DEBUG) {
            console.debug(data);
        }
        if (level === LOG_LEVEL.ERROR) {
            console.error(data);
        }
        if (level === LOG_LEVEL.FATAL) {
            console.error(data);
        }
        if (level === LOG_LEVEL.INFO) {
            console.info(data);
        }
        if (level === LOG_LEVEL.VERBOSE) {
            console.trace(data);
        }
        if (level === LOG_LEVEL.WARN) {
            console.warn(data);
        }
    }

    private spansToMilliseconds(
        spans: LogSpans,
    ): Partial<Record<string, number>> {
        return Object.fromEntries(
            Object.entries(spans)
                .map(([key, value]) => {
                    return [key, value?.toMilliseconds()] as const;
                })
                .filter(([_key, value]) => {
                    return value !== undefined;
                }),
        );
    }

    log(data: LogData): void {
        const { spans, loggedAt, metadata, error, ...rest } = data;
        const newSpans =
            spans === undefined ? undefined : this.spansToMilliseconds(spans);

        const newData = {
            ...rest,
            loggedAt: new Date(loggedAt),
            ...(newSpans !== undefined && { spans: newSpans }),
            ...(metadata !== undefined && { metadata }),
            ...(error !== undefined && { error }),
        };

        this.logToConsole(rest.level, newData);
    }
}
