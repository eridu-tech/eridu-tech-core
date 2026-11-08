/**
 * @module Observability
 */

import type { Lazy } from "@/utilities/_module-exports.js";

/**
 * Application logging contract.
 *
 * Offers leveled logging methods plus scoped helpers for measuring time
 * (`span`) and attaching metadata (`scopedMetadata`, `putMetadata`). The
 * contract is backend agnostic: `ILoggerTransport` describes how entries are
 * forwarded to an actual logging system.
 *
 * IMPORT_PATH: `"eridu-tech/logger/contracts"`
 * @group Contracts
 */
export type ILogger = {
    /**
     * Use it to log fine-grained diagnostic details.
     *
     * @param messages - Values to log.
     */
    debug(...messages: Array<unknown>): void;

    /**
     * Use it to log detailed progress information that is still meant for
     * humans, sitting between `debug` and `info` in severity.
     *
     * @param messages - Values to log.
     */
    verbose(...messages: Array<unknown>): void;

    /**
     * Use it to log a regular application event.
     *
     * @param messages - Values to log.
     */
    info(...messages: Array<unknown>): void;

    /**
     * Use it to log a recoverable problem that is worth investigating.
     *
     * @param messages - Values to log.
     */
    warn(...messages: Array<unknown>): void;

    /**
     * Use it to log an error that was handled but made an operation fail.
     *
     * @param messages - Values to log.
     */
    error(...messages: Array<unknown>): void;

    /**
     * Use it to log a critical failure the application cannot recover from.
     *
     * @param messages - Values to log.
     */
    fatal(...messages: Array<unknown>): void;

    /**
     * Runs `invocable` inside a span named `name`.
     *
     * Entries logged while the span is open include its elapsed time alongside
     * the elapsed time of every enclosing span. Entries logged after the span
     * returns do not include it, so log from inside to capture the duration.
     *
     * @param name - Span name, used as the key in `LogData.spans`.
     * @param invocable - Work to run inside the span. Invoked immediately.
     *
     * @returns Whatever `invocable` returns.
     */
    span<TValue>(name: string, invocable: Lazy<TValue>): TValue;

    /**
     * Attaches `values` as metadata to entries logged while `invocable` runs.
     *
     * Metadata is inherited by nested spans and metadata scopes, and restored
     * when `invocable` returns. Useful for correlation IDs, user IDs, and other
     * request context.
     *
     * @param values - Metadata entries to apply during the invocation.
     * @param invocable - Work to run with the metadata attached. Invoked
     * immediately.
     *
     * @returns Whatever `invocable` returns.
     */
    scopedMetadata<TValue>(
        values: Partial<Record<string, unknown>>,
        invocable: Lazy<TValue>,
    ): TValue;

    /**
     * Attaches a single `key`-`value` pair as metadata. Shorthand for
     * `scopedMetadata({ [key]: value }, invocable)`.
     *
     * @param key - Metadata name.
     * @param value - Metadata value.
     * @param invocable - Work to run with the metadata attached. Invoked
     * immediately.
     *
     * @returns Whatever `invocable` returns.
     */
    scopedMetadata<TValue>(
        key: string,
        value: unknown,
        invocable: Lazy<TValue>,
    ): TValue;

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
