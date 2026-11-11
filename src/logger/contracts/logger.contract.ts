/**
 * @module Observability
 */

import type { Lazy } from "@/utilities/_module-exports.js";

/**
 * IMPORT_PATH: `"eridu-tech/logger/contracts"`
 * @group Contracts
 */
export type LogMetadata = Partial<Record<string, unknown>>;

/**
 * Extra information attached to a single log entry, alongside its messages.
 *
 * IMPORT_PATH: `"eridu-tech/logger/contracts"`
 * @group Contracts
 */
export type LogExtraInfo = {
    /**
     * Grouping label for the entry, such as a module or subsystem name.
     */
    group?: string;

    /**
     * Metadata attached to this entry only, without opening a metadata scope.
     */
    metadata?: LogMetadata;
};

/**
 * Extra information for failure entries logged by `warn`, `error`, and
 * `fatal`. Extends {@link LogExtraInfo | `LogExtraInfo`} with error details.
 *
 * IMPORT_PATH: `"eridu-tech/logger/contracts"`
 * @group Contracts
 */
export type FailureLogExtraInfo = LogExtraInfo & {
    /**
     * Error details to attach to the entry.
     */
    error?: unknown;
};

/**
 * Logging scope for a single `ILogger.run` invocation. `group` and `metadata`
 * apply to every entry logged inside the invocation, and `span` names the span
 * that measures its duration.
 *
 * IMPORT_PATH: `"eridu-tech/logger/contracts"`
 * @group Contracts
 */
export type RunLogSettings = LogExtraInfo & {
    /**
     * Name of the span that measures the invocation. When set, entries logged
     * inside the invocation carry the elapsed time under this name.
     */
    span?: string;
};

/**
 * Application logging contract.
 *
 * Offers leveled logging methods plus scoped helpers for measuring time
 * (`span`) and attaching metadata (`scopedMetadata`, `putMetadata`). Every
 * level takes the values to log plus optional {@link LogExtraInfo} for
 * per-entry grouping and metadata; failure levels also accept error details.
 * The contract is backend agnostic: `ILoggerTransport` describes how entries
 * are forwarded to an actual logging system.
 *
 * IMPORT_PATH: `"eridu-tech/logger/contracts"`
 * @group Contracts
 */
export type ILogger = {
    /**
     * Use it to log fine-grained diagnostic details.
     *
     * @param messages - Values to log, in the order passed.
     * @param extraInfo - Optional group and metadata for this entry.
     */
    debug(messages: Array<unknown>, extraInfo?: LogExtraInfo): void;

    /**
     * Use it to log detailed progress information that is still meant for
     * humans, sitting between `debug` and `info` in severity.
     *
     * @param messages - Values to log, in the order passed.
     * @param extraInfo - Optional group and metadata for this entry.
     */
    verbose(messages: Array<unknown>, extraInfo?: LogExtraInfo): void;

    /**
     * Use it to log a regular application event.
     *
     * @param messages - Values to log, in the order passed.
     * @param extraInfo - Optional group and metadata for this entry.
     */
    info(messages: Array<unknown>, extraInfo?: LogExtraInfo): void;

    /**
     * Use it to log a recoverable problem that is worth investigating.
     *
     * @param messages - Values to log, in the order passed.
     * @param extraInfo - Optional group, metadata, and error details for this
     * entry.
     */
    warn(messages: Array<unknown>, extraInfo?: FailureLogExtraInfo): void;

    /**
     * Use it to log an error that was handled but made an operation fail.
     *
     * @param messages - Values to log, in the order passed.
     * @param extraInfo - Optional group, metadata, and error details for this
     * entry.
     */
    error(messages: Array<unknown>, extraInfo?: FailureLogExtraInfo): void;

    /**
     * Use it to log a critical failure the application cannot recover from.
     *
     * @param messages - Values to log, in the order passed.
     * @param extraInfo - Optional group, metadata, and error details for this
     * entry.
     */
    fatal(messages: Array<unknown>, extraInfo?: FailureLogExtraInfo): void;

    run<TValue = void>(
        invocable: Lazy<TValue>,
        settings?: RunLogSettings,
    ): TValue;

    // /**
    //  * Runs `invocable` inside a span named `name`.
    //  *
    //  * Entries logged while the span is open include its elapsed time alongside
    //  * the elapsed time of every enclosing span. Entries logged after the span
    //  * returns do not include it, so log from inside to capture the duration.
    //  *
    //  * @param name - Span name, used as the key in `LogData.spans`.
    //  * @param invocable - Work to run inside the span. Invoked immediately.
    //  *
    //  * @returns Whatever `invocable` returns.
    //  */
    // span<TValue>(name: string, invocable: Lazy<TValue>): TValue;

    // /**
    //  * Attaches `values` as metadata to entries logged while `invocable` runs.
    //  *
    //  * Metadata is inherited by nested spans and metadata scopes, and restored
    //  * when `invocable` returns. Useful for correlation IDs, user IDs, and other
    //  * request context.
    //  *
    //  * @param values - Metadata entries to apply during the invocation.
    //  * @param invocable - Work to run with the metadata attached. Invoked
    //  * immediately.
    //  *
    //  * @returns Whatever `invocable` returns.
    //  */
    // scopedMetadata<TValue>(
    //     values: Partial<Record<string, unknown>>,
    //     invocable: Lazy<TValue>,
    // ): TValue;

    // /**
    //  * Attaches a single `key`-`value` pair as metadata. Shorthand for
    //  * `scopedMetadata({ [key]: value }, invocable)`.
    //  *
    //  * @param key - Metadata name.
    //  * @param value - Metadata value.
    //  * @param invocable - Work to run with the metadata attached. Invoked
    //  * immediately.
    //  *
    //  * @returns Whatever `invocable` returns.
    //  */
    // scopedMetadata<TValue>(
    //     key: string,
    //     value: unknown,
    //     invocable: Lazy<TValue>,
    // ): TValue;

    /**
     * Merges `values` into the metadata of the current scope, without opening
     * a new one. The result is not restored afterwards.
     *
     * Use `scopedMetadata` instead to scope the values to an invocation.
     *
     * @param values - Metadata entries to merge.
     */
    putMetadata(values: Partial<Record<string, unknown>>): void;

    /**
     * Merges a single `key`-`value` pair into the metadata of the current
     * scope. Shorthand for `putMetadata({ [key]: value })`.
     *
     * @param key - Metadata name.
     * @param value - Metadata value.
     */
    putMetadata(key: string, value: unknown): void;
};
