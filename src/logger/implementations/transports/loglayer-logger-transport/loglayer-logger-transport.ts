/**
 * @module Observability
 */

import { LOG_LEVEL } from "@/logger/contracts/_module-exports.js";

import type { LogLayer, LogLevelType } from "loglayer";

import type {
    AllLogLevels,
    ILoggerTransport,
    LogData,
} from "@/logger/contracts/_module-exports.js";

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
 * Configuration for `LogLayerLoggerTransport`.
 * Requires a LogLayer instance that receives the entries.
 *
 * IMPORT_PATH: `"eridu-tech/logger/loglayer-logger-transport"`
 * @group Transports
 */
export type LogLayerLoggerTransportSettings = {
    /**
     * The LogLayer instance that receives the entries.
     */
    logger: LogLayer;

    /**
     * Whether `loggedAt` is attached to the entry metadata.
     *
     * @default true
     */
    includeLoggedAt?: boolean;
};

/**
 * To utilize the `LogLayerLoggerTransport`, install the
 * [`"loglayer"`](https://www.npmjs.com/package/loglayer) package and supply a
 * configured `LogLayer` instance.
 *
 * Each entry is forwarded through `LogLayer.raw`, mapping the logger's
 * `verbose` level to LogLayer's `trace` level. `loggedAt` is rendered as a
 * `Date` and attached to the entry metadata when `includeLoggedAt` is enabled
 * (the default); spans are attached as milliseconds. Logged values are passed
 * through untouched, leaving serialization to LogLayer.
 *
 * IMPORT_PATH: `"eridu-tech/logger/loglayer-logger-transport"`
 * @group Transports
 */
export class LogLayerLoggerTransport implements ILoggerTransport {
    private readonly logger: LogLayer;
    private readonly includeLoggedAt: boolean;

    constructor(settings: LogLayerLoggerTransportSettings) {
        const { logger, includeLoggedAt = true } = settings;

        this.logger = logger;
        this.includeLoggedAt = includeLoggedAt;
    }

    log(data: LogData): void {
        const { level, loggedAt, messages, metadata, spans } = data;
        const newSpans = Object.fromEntries(
            Object.entries(spans)
                .map(([key, value]) => {
                    return [key, value?.toMilliseconds()] as const;
                })
                .filter(([_key, value]) => {
                    return value !== undefined;
                }),
        );

        this.logger.raw({
            logLevel: LOG_LAYER_LEVELS[level],
            messages: messages as Array<LogLayerMessage>,
            metadata: {
                ...metadata,
                ...(this.includeLoggedAt && { loggedAt: new Date(loggedAt) }),
                spans: newSpans,
            },
        });
    }
}
