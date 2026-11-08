/**
 * @module Observability
 */

import { LOG_LEVEL } from "@/logger/contracts/_module-exports.js";
import { UnableToSerializeSerdeError } from "@/serde/contracts/serde.errors.js";

import type { LogLayer } from "loglayer";

import type {
    ILoggerTransport,
    LogData,
} from "@/logger/contracts/_module-exports.js";
import type { ISerializer } from "@/serde/contracts/serializer.contract.js";

/**
 * Primitive values accepted by LogLayer's logging methods.
 *
 * @internal
 */
type LogLayerMessage = string | number | boolean | null | undefined;

/**
 * Default serializer, converting values to JSON.
 *
 * @internal
 */
class Serializer implements ISerializer<LogLayerMessage> {
    serialize<TValue>(value: TValue): LogLayerMessage {
        if (
            typeof value === "string" ||
            typeof value === "number" ||
            typeof value === "boolean" ||
            value === null ||
            value === undefined
        ) {
            return value as LogLayerMessage;
        }
        try {
            return JSON.stringify(value);
        } catch (error: unknown) {
            throw UnableToSerializeSerdeError.create(error);
        }
    }
}

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
     * Serializes each logged value into a value accepted by LogLayer.
     *
     * @default JSON serialization
     */
    serializer?: ISerializer<LogLayerMessage>;

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
 * Each entry is forwarded through LogLayer's level methods, mapping the
 * logger's `verbose` level to LogLayer's `trace` level. `loggedAt` is rendered
 * as a `Date` and attached to the entry metadata when `includeLoggedAt` is
 * enabled (the default); spans are attached as milliseconds. Logged values are
 * serialized with the configured serializer (JSON by default) before being
 * forwarded.
 *
 * IMPORT_PATH: `"eridu-tech/logger/loglayer-logger-transport"`
 * @group Transports
 */
export class LogLayerLoggerTransport implements ILoggerTransport {
    private readonly logger: LogLayer;
    private readonly serializer: ISerializer<LogLayerMessage>;
    private readonly includeLoggedAt: boolean;

    constructor(settings: LogLayerLoggerTransportSettings) {
        const {
            logger,
            includeLoggedAt = true,
            serializer = new Serializer(),
        } = settings;

        this.logger = logger;
        this.serializer = serializer;
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

        const logger = this.logger.withMetadata({
            ...metadata,
            ...(this.includeLoggedAt && { loggedAt: new Date(loggedAt) }),
            spans: newSpans,
        });
        const logMessages = messages.map((message) => {
            return this.serializer.serialize(message);
        });

        if (level === LOG_LEVEL.DEBUG) {
            logger.debug(...logMessages);
        }
        if (level === LOG_LEVEL.VERBOSE) {
            logger.trace(...logMessages);
        }
        if (level === LOG_LEVEL.INFO) {
            logger.info(...logMessages);
        }
        if (level === LOG_LEVEL.WARN) {
            logger.warn(...logMessages);
        }
        if (level === LOG_LEVEL.ERROR) {
            logger.error(...logMessages);
        }
        if (level === LOG_LEVEL.FATAL) {
            logger.fatal(...logMessages);
        }
    }
}
