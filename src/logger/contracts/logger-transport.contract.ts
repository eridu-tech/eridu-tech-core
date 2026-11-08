/**
 * @module Observability
 */
import type { TimeSpan } from "@/time-span/implementations/_module-exports.js";

/**
 * Log levels, from least to most severe.
 *
 * IMPORT_PATH: `"eridu-tech/logger/contracts"`
 * @group Contracts
 */
export const LOG_LEVEL = {
    DEBUG: "debug",
    VERBOSE: "verbose",
    INFO: "info",
    WARN: "warn",
    ERROR: "error",
    FATAL: "fatal",
} as const;

/**
 * Any of the `LOG_LEVEL` values.
 *
 * IMPORT_PATH: `"eridu-tech/logger/contracts"`
 * @group Contracts
 */
export type AllLogLevels = (typeof LOG_LEVEL)[keyof typeof LOG_LEVEL];

/**
 * Self-contained log entry handed to a logger transport.
 * Holds everything a logging backend needs to format and output a record, so
 * transports stay independent of the `ILogger` implementation.
 *
 * IMPORT_PATH: `"eridu-tech/logger/contracts"`
 * @group Contracts
 */
export type LogData = {
    /**
     * Severity of the entry.
     */
    level: AllLogLevels;

    /**
     * Unix timestamp in ms at which the entry was created.
     */
    loggedAt: number;

    /**
     * Logged values, in the order they were passed to the logger.
     */
    messages: Array<unknown>;

    /**
     * Metadata attached by `scopedMetadata` and `putMetadata`, keyed by
     * metadata name.
     */
    metadata: Partial<Record<string, unknown>>;

    /**
     * Elapsed time of each span still open when the entry was created, keyed by
     * span name. Empty for entries logged outside any span.
     */
    spans: Partial<Record<string, TimeSpan>>;
};

/**
 * Technology-agnostic logger transport contract.
 *
 * Implement it to forward log entries to a specific logging backend (console,
 * file, OpenTelemetry, Sentry, etc.) without coupling `ILogger` consumers to
 * that backend. Each entry arrives as one fully built
 * {@link LogData | `LogData`} record, so the backend only has to format and
 * output it.
 *
 * IMPORT_PATH: `"eridu-tech/logger/contracts"`
 * @group Contracts
 */
export type ILoggerTransport = {
    /**
     * Outputs a single log entry.
     *
     * @param data - The entry to output.
     */
    log(data: LogData): void;
};
