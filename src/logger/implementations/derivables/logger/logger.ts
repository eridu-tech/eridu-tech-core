import { contextToken } from "@/execution-context/contracts/_module-exports.js";
import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";
import { LOG_LEVEL } from "@/logger/contracts/_module-exports.js";
import { ComposableLoggerTransport } from "@/logger/implementations/derivables/logger/composable-logger-transport.js";
import { TimeSpan } from "@/time-span/implementations/time-span.js";
import {
    callInvocable,
    isLazy,
    UnexpectedError,
} from "@/utilities/_module-exports.js";

import type { IExecutionContext } from "@/execution-context/contracts/_module-exports.js";
import type {
    ILogger,
    ILoggerTransport,
    LogData,
} from "@/logger/contracts/_module-exports.js";
import type { Lazy, OneOrMore } from "@/utilities/_module-exports.js";

/**
 * Settings shared by {@link Logger} instances, without the transport.
 *
 * IMPORT_PATH: `"eridu-tech/logger"`
 * @group Transports
 */
export type LoggerSettingsBase = {
    /**
     * Context that scopes `span` and `scopedMetadata`. Both are inert when the
     * execution context keeps no state (such as
     * `NoOpExecutionContextAdapter`), so use `AlsExecutionContextAdapter` in
     * Node.js.
     */
    executionContext?: IExecutionContext;
};

/**
 * Settings for {@link Logger}.
 *
 * IMPORT_PATH: `"eridu-tech/logger"`
 * @group Transports
 */
export type LoggerSettings = LoggerSettingsBase & {
    /**
     * One transport or an iterable of transports. Multiple transports are
     * merged, and every entry is forwarded to each of them in order.
     */
    transport: OneOrMore<ILoggerTransport>;
};

/**
 * @internal
 */
type Frame = {
    name: string;
    /**
     * Monotonic timestamp in ms (`performance.now()`); used only for deltas.
     */
    startedAt: number;
};

/**
 * Backend-agnostic logger that forwards entries to its transports.
 *
 * The configured transports are merged, so every entry reaches each of them in
 * order.
 *
 * `span`, `scopedMetadata`, and `putMetadata` read and write through the
 * execution context, so entries logged inside a scope carry its data and
 * entries logged afterwards do not.
 *
 * IMPORT_PATH: `"eridu-tech/logger"`
 * @group Transports
 */
export class Logger implements ILogger {
    private readonly transport: ILoggerTransport;
    private readonly executionContext: IExecutionContext;
    private readonly framesToken = contextToken<Array<Frame>>("");
    private readonly metadataToken =
        contextToken<Partial<Record<string, unknown>>>("");

    constructor(settings: LoggerSettings) {
        const {
            transport,
            executionContext = new ExecutionContext(
                new NoOpExecutionContextAdapter(),
            ),
        } = settings;

        this.transport = new ComposableLoggerTransport(transport);
        this.executionContext = executionContext;
    }

    private getSpans(): Partial<Record<string, TimeSpan>> {
        const frames = this.executionContext.getOr(this.framesToken, []);
        const now = performance.now();
        return Object.fromEntries(
            [...frames]
                .reverse()
                .map((frame): [string, TimeSpan] => [
                    frame.name,
                    TimeSpan.fromMilliseconds(now - frame.startedAt),
                ]),
        );
    }

    private getMetadata(): Pick<LogData, "metadata" | "spans"> {
        return {
            spans: this.getSpans(),
            metadata: this.executionContext.getOr(this.metadataToken, {}),
        };
    }

    private static getCurrentDateAsUnixTimestampInMs(): number {
        return performance.timeOrigin + performance.now();
    }

    debug(...messages: Array<unknown>): void {
        this.transport.log({
            level: LOG_LEVEL.DEBUG,
            loggedAt: Logger.getCurrentDateAsUnixTimestampInMs(),
            messages,
            ...this.getMetadata(),
        });
    }

    verbose(...messages: Array<unknown>): void {
        this.transport.log({
            level: LOG_LEVEL.VERBOSE,
            loggedAt: Logger.getCurrentDateAsUnixTimestampInMs(),
            messages,
            ...this.getMetadata(),
        });
    }

    info(...messages: Array<unknown>): void {
        this.transport.log({
            level: LOG_LEVEL.INFO,
            loggedAt: Logger.getCurrentDateAsUnixTimestampInMs(),
            messages,
            ...this.getMetadata(),
        });
    }

    warn(...messages: Array<unknown>): void {
        this.transport.log({
            level: LOG_LEVEL.WARN,
            loggedAt: Logger.getCurrentDateAsUnixTimestampInMs(),
            messages,
            ...this.getMetadata(),
        });
    }

    error(...messages: Array<unknown>): void {
        this.transport.log({
            level: LOG_LEVEL.ERROR,
            loggedAt: Logger.getCurrentDateAsUnixTimestampInMs(),
            messages,
            ...this.getMetadata(),
        });
    }

    fatal(...messages: Array<unknown>): void {
        this.transport.log({
            level: LOG_LEVEL.FATAL,
            loggedAt: Logger.getCurrentDateAsUnixTimestampInMs(),
            messages,
            ...this.getMetadata(),
        });
    }

    private openSpan(name: string): void {
        this.executionContext.putPush(this.framesToken, {
            name,
            startedAt: performance.now(),
        });
    }

    span<TValue>(name: string, invocable: Lazy<TValue>): TValue {
        return this.executionContext.run(() => {
            this.openSpan(name);
            return callInvocable(invocable);
        });
    }

    private saveMetadata(values: Partial<Record<string, unknown>>): void {
        const metadata = this.executionContext.getOr(this.metadataToken, {});
        this.executionContext.put(this.metadataToken, {
            ...metadata,
            ...values,
        });
    }

    private scopedMetadataMultiple<TValue>(
        values: Partial<Record<string, unknown>>,
        invocable: Lazy<TValue>,
    ): TValue {
        return this.executionContext.run(() => {
            this.saveMetadata(values);
            return callInvocable(invocable);
        });
    }

    private scopedMetadataSingle<TValue>(
        key: string,
        value: unknown,
        invocable: Lazy<TValue>,
    ): TValue {
        return this.scopedMetadataMultiple({ [key]: value }, invocable);
    }

    scopedMetadata<TValue>(
        values: Partial<Record<string, unknown>>,
        invocable: Lazy<TValue>,
    ): TValue;
    scopedMetadata<TValue>(
        key: string,
        value: unknown,
        invocable: Lazy<TValue>,
    ): TValue;
    scopedMetadata<TValue>(
        valuesOrKey: string | Partial<Record<string, unknown>>,
        valueOrInvocable: unknown,
        invocable?: Lazy<TValue>,
    ): TValue {
        if (typeof valuesOrKey === "string") {
            return this.scopedMetadataSingle(
                valuesOrKey,
                valueOrInvocable,
                invocable as Lazy<TValue>,
            );
        }
        if (isLazy(valueOrInvocable)) {
            return this.scopedMetadataMultiple(
                valuesOrKey,
                valueOrInvocable as Lazy<TValue>,
            );
        }

        throw UnexpectedError.create(
            "scopedMetadata expected (values, invocable) or (key, value, invocable)",
        );
    }

    putMetadata(key: string, value: unknown): void;
    putMetadata(values: Partial<Record<string, unknown>>): void;
    putMetadata(
        keyOrValue: string | Partial<Record<string, unknown>>,
        value?: unknown,
    ): void {
        if (typeof keyOrValue === "string") {
            this.saveMetadata({
                [keyOrValue]: value,
            });
            return;
        }
        this.saveMetadata(keyOrValue);
    }
}
