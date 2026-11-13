/**
 * @module Log
 */

import { logs, SeverityNumber } from "@opentelemetry/api";

import type { Logger } from "@opentelemetry/api";

import type {
    AllLogLevels,
    ILogTransport,
    LogData,
    LogSpans,
} from "@/log/contracts/_module-exports.js";

/**
 * Configuration for `OtelLogTransport`.
 *
 * IMPORT_PATH: `"eridu-tech/log/otel-log-transport"`
 * @group Transports
 */
export type OtelLogTransportSettings = {
    /**
     * The OpenTelemetry Logger that receives the entries.
     *
     * @default
     * ```ts
     * import { logs } from "@opentelemetry/api";
     *
     * logs.getLogger("eridu-tech")
     * ```
     */
    log?: Logger;
};

/**
 * Forwards log entries to an OpenTelemetry `Log`.
 *
 * Levels map to OTel severities (`verbose` maps to `TRACE`), messages become
 * the record `body`, and `group`, `metadata`, `error`, and spans in
 * milliseconds are attached as attributes.
 *
 * IMPORT_PATH: `"eridu-tech/log/otel-log-transport"`
 * @group Transports
 */
export class OtelLogTransport implements ILogTransport {
    private static logLayerLevels: Record<AllLogLevels, number> = {
        fatal: SeverityNumber.FATAL,
        error: SeverityNumber.ERROR,
        warn: SeverityNumber.WARN,
        info: SeverityNumber.INFO,
        debug: SeverityNumber.DEBUG,
        verbose: SeverityNumber.TRACE,
    };

    private static getSeverityNumber(level: AllLogLevels): SeverityNumber {
        return OtelLogTransport.logLayerLevels[level];
    }

    private readonly otelLogger: Logger;

    constructor(settings: OtelLogTransportSettings = {}) {
        const { log = logs.getLogger("eridu-tech") } = settings;

        this.otelLogger = log;
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

        this.otelLogger.emit({
            severityNumber: OtelLogTransport.getSeverityNumber(level),
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
