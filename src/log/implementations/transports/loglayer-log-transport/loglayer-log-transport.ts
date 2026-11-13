/**
 * @module Logger
 */

import { LOG_LEVEL } from "@/log/contracts/_module-exports.js";

import type { LogLayer, LogLevelType } from "loglayer";

import type {
    AllLogLevels,
    ILogTransport,
    LogData,
    LogSpans,
} from "@/log/contracts/_module-exports.js";

/**
 * Primitive values accepted by LogLayer's logging methods.
 *
 * @internal
 */
type LogLayerMessage = string | number | boolean | null | undefined;

const LOG_LAYER_LEVELS: Record<AllLogLevels, LogLevelType> = {
    [LOG_LEVEL.DEBUG]: "debug",
    [LOG_LEVEL.VERBOSE]: "trace",
    [LOG_LEVEL.INFO]: "info",
    [LOG_LEVEL.WARN]: "warn",
    [LOG_LEVEL.ERROR]: "error",
    [LOG_LEVEL.FATAL]: "fatal",
};

/**
 * Configuration for `LogLayerLogTransport`.
 * Requires a LogLayer instance that receives the entries.
 *
 * IMPORT_PATH: `"eridu-tech/log/loglayer-log-transport"`
 * @group Transports
 */
export type LogLayerLogTransportSettings = {
    /**
     * The LogLayer instance that receives the entries.
     */
    log: LogLayer;

    /**
     * Whether `loggedAt` is attached to the entry metadata.
     *
     * @default true
     */
    includeLoggedAt?: boolean;
};

/**
 * To utilize the `LogLayerLogTransport`, install the
 * [`"loglayer"`](https://www.npmjs.com/package/loglayer) package and supply a
 * configured `LogLayer` instance.
 *
 * Each entry is forwarded through `LogLayer.raw`, mapping the log's
 * `verbose` level to LogLayer's `trace` level. `loggedAt` is rendered as a
 * `Date` and attached to the entry metadata when `includeLoggedAt` is enabled
 * (the default); spans are attached as milliseconds. Logged values are passed
 * through untouched, leaving serialization to LogLayer.
 *
 * IMPORT_PATH: `"eridu-tech/log/loglayer-log-transport"`
 * @group Transports
 */
export class LogLayerLogTransport implements ILogTransport {
    private readonly logLayer: LogLayer;
    private readonly includeLoggedAt: boolean;

    constructor(settings: LogLayerLogTransportSettings) {
        const { log, includeLoggedAt = true } = settings;

        this.logLayer = log;
        this.includeLoggedAt = includeLoggedAt;
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
        const { spans, loggedAt, metadata, error, level, messages, group } =
            data;
        const newSpans =
            spans === undefined ? undefined : this.spansToMilliseconds(spans);

        const logData = {
            logLevel: LOG_LAYER_LEVELS[level],
            messages: messages as Array<LogLayerMessage>,
            metadata: {
                attributes: metadata,
                ...(this.includeLoggedAt && { loggedAt: new Date(loggedAt) }),
                spans: newSpans,
            },
            ...(error !== undefined && { error }),
        } as const;

        if (group === undefined) {
            this.logLayer.raw(logData);
        } else {
            this.logLayer.withPrefix(`[${group}]`).raw(logData);
        }
    }
}
