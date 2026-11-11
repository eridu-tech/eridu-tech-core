/**
 * @module Logger
 */

import { logs, SeverityNumber } from "@opentelemetry/api";

import type { Logger } from "@opentelemetry/api";

import type {
    AllLogLevels,
    ILoggerTransport,
    LogData,
    LogSpans,
} from "@/logger/contracts/_module-exports.js";

/**
 * Configuration for `OtelLoggerTransport`.
 *
 * IMPORT_PATH: `"eridu-tech/logger/otel-logger-transport"`
 * @group Transports
 */
export type OtelLoggerTransportSettings = {
    /**
     * The Otel Log instance that receives the entries.
     *
     * @default
     * ```ts
     * import { logs } from "@opentelemetry/api";
     *
     * logs.getLogger("eridu-tech")
     * ```
     */
    logger?: Logger;
};

/**
 * Forwards log entries to an OpenTelemetry `Logger`.
 *
 * Levels map to OTel severities (`verbose` maps to `TRACE`), messages become
 * the record `body`, and `group`, `metadata`, `error`, and spans in
 * milliseconds are attached as attributes.
 *
 * IMPORT_PATH: `"eridu-tech/logger/otel-logger-transport"`
 * @group Transports
 */
export class OtelLoggerTransport implements ILoggerTransport {
    private static logLayerLevels: Record<AllLogLevels, number> = {
        fatal: SeverityNumber.FATAL,
        error: SeverityNumber.ERROR,
        warn: SeverityNumber.WARN,
        info: SeverityNumber.INFO,
        debug: SeverityNumber.DEBUG,
        verbose: SeverityNumber.TRACE,
    };

    private static getSeverityNumber(level: AllLogLevels): SeverityNumber {
        return OtelLoggerTransport.logLayerLevels[level];
    }

    private readonly logger: Logger;

    constructor(settings: OtelLoggerTransportSettings = {}) {
        const { logger = logs.getLogger("eridu-tech") } = settings;

        this.logger = logger;
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
        const { spans, metadata, error, level, messages, group } = data;
        const newSpans =
            spans === undefined ? undefined : this.spansToMilliseconds(spans);

        this.logger.emit({
            severityNumber: OtelLoggerTransport.getSeverityNumber(level),
            severityText: level,
            body: messages,
            attributes: {
                metadata,
                error,
                group,
                spans: newSpans,
            },
        });
    }
}
