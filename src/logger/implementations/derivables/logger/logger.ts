import { contextToken } from "@/execution-context/contracts/_module-exports.js";
import { NoOpExecutionContextAdapter } from "@/execution-context/implementations/adapters/no-op-execution-context-adapter/_module-exports.js";
import { ExecutionContext } from "@/execution-context/implementations/derivables/_module-exports.js";
import {
    LOG_LEVEL,
    UnableToLogError,
} from "@/logger/contracts/_module-exports.js";
import { TimeSpan } from "@/time-span/implementations/time-span.js";
import {
    callInvocable,
    getConstructorName,
    isObjectEmpty,
} from "@/utilities/_module-exports.js";

import type {
    ContextToken,
    IExecutionContext,
} from "@/execution-context/contracts/_module-exports.js";
import type {
    AllLogLevels,
    FailureLogExtraInfo,
    ILogger,
    ILoggerTransport,
    LogData,
    LogExtraInfo,
    LogMetadata,
    RunLogSettings,
} from "@/logger/contracts/_module-exports.js";
import type { Lazy } from "@/utilities/_module-exports.js";

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
    transport: ILoggerTransport;

    spansToken?: ContextToken<Array<Frame>>;

    metadataToken?: ContextToken<LogMetadata>;

    groupNameToken?: ContextToken<string>;
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
    private readonly spansToken: ContextToken<Array<Frame>>;
    private readonly metadataToken: ContextToken<LogMetadata>;
    private readonly groupNameToken: ContextToken<string>;

    constructor(settings: LoggerSettings) {
        const {
            transport,
            spansToken = contextToken(
                `Logger.${getConstructorName(transport)}.spans`,
            ),
            metadataToken = contextToken(
                `Logger.${getConstructorName(transport)}.metadata`,
            ),
            groupNameToken = contextToken(
                `Logger.${getConstructorName(transport)}.groupName`,
            ),
            executionContext = new ExecutionContext(
                new NoOpExecutionContextAdapter(),
            ),
        } = settings;

        this.spansToken = spansToken;
        this.metadataToken = metadataToken;
        this.groupNameToken = groupNameToken;
        this.transport = transport;
        this.executionContext = executionContext;
    }

    private getSpans(): Partial<Record<string, TimeSpan>> {
        const frames = this.executionContext.getOr(this.spansToken, []);
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

    private getMetadata(): Required<Pick<LogData, "metadata" | "spans">> {
        return {
            spans: this.getSpans(),
            metadata: this.executionContext.getOr(this.metadataToken, {}),
        };
    }

    private static getCurrentDateAsUnixTimestampInMs(): number {
        return performance.timeOrigin + performance.now();
    }

    private getGroupName(): string | undefined {
        return this.executionContext.get(this.groupNameToken) ?? undefined;
    }

    private log(
        level: AllLogLevels,
        messages: Array<unknown>,
        extraInfo: FailureLogExtraInfo = {},
    ): void {
        try {
            const { group = this.getGroupName(), metadata, error } = extraInfo;
            const { metadata: scopedMetadata, spans } = this.getMetadata();

            const combinedMetadata = {
                ...scopedMetadata,
                ...metadata,
            };
            this.transport.log({
                level,
                loggedAt: Logger.getCurrentDateAsUnixTimestampInMs(),
                messages,
                metadata: isObjectEmpty(combinedMetadata)
                    ? undefined
                    : combinedMetadata,
                spans: isObjectEmpty(spans) ? undefined : spans,
                group,
                error,
            });
        } catch (error: unknown) {
            throw UnableToLogError.create(error);
        }
    }

    debug(messages: Array<unknown>, extraInfo?: LogExtraInfo): void {
        this.log(LOG_LEVEL.DEBUG, messages, extraInfo);
    }

    verbose(messages: Array<unknown>, extraInfo?: LogExtraInfo): void {
        this.log(LOG_LEVEL.VERBOSE, messages, extraInfo);
    }

    info(messages: Array<unknown>, extraInfo?: LogExtraInfo): void {
        this.log(LOG_LEVEL.INFO, messages, extraInfo);
    }

    warn(messages: Array<unknown>, extraInfo?: FailureLogExtraInfo): void {
        this.log(LOG_LEVEL.WARN, messages, extraInfo);
    }

    error(messages: Array<unknown>, extraInfo?: FailureLogExtraInfo): void {
        this.log(LOG_LEVEL.ERROR, messages, extraInfo);
    }

    fatal(messages: Array<unknown>, extraInfo?: FailureLogExtraInfo): void {
        this.log(LOG_LEVEL.FATAL, messages, extraInfo);
    }

    private openSpan(name: string): void {
        this.executionContext.putPush(this.spansToken, {
            name,
            startedAt: performance.now(),
        });
    }

    private saveMetadata(values: LogMetadata): void {
        const metadata = this.executionContext.getOr(this.metadataToken, {});
        this.executionContext.put(this.metadataToken, {
            ...metadata,
            ...values,
        });
    }

    private setGroupName(name: string): void {
        this.executionContext.put(this.groupNameToken, name);
    }

    run<TValue = void>(
        invocable: Lazy<TValue>,
        settings: RunLogSettings = {},
    ): TValue {
        const { group, metadata, span } = settings;
        return this.executionContext.run(() => {
            if (group !== undefined) {
                this.setGroupName(group);
            }
            if (metadata !== undefined) {
                this.saveMetadata(metadata);
            }
            if (span !== undefined) {
                this.openSpan(span);
            }
            return callInvocable(invocable);
        });
    }

    putMetadata(key: string, value: unknown): void;
    putMetadata(values: LogMetadata): void;
    putMetadata(keyOrValue: string | LogMetadata, value?: unknown): void {
        if (typeof keyOrValue === "string") {
            this.saveMetadata({
                [keyOrValue]: value,
            });
            return;
        }
        this.saveMetadata(keyOrValue);
    }
}
