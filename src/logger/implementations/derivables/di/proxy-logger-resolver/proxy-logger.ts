/**
 * @module Observability
 */

import type {
    DiToken,
    IServiceResolver,
} from "@/di/contracts/_module-exports.js";
import type {
    FailureLogExtraInfo,
    ILogger,
    ILoggerResolver,
    LogExtraInfo,
    RunLogSettings,
} from "@/logger/contracts/_module-exports.js";
import type { Lazy } from "@/utilities/_module-exports.js";

/**
 * @internal
 */
export class ProxyLogger<
    TTransports extends string = string,
> implements ILogger {
    constructor(
        private readonly container: Pick<IServiceResolver, "resolveOrFail">,
        private readonly resolverToken: DiToken<ILoggerResolver<TTransports>>,
        private readonly transportName: TTransports | undefined,
    ) {}

    private getLogger(): ILogger {
        const loggerResolver = this.container.resolveOrFail(this.resolverToken);
        return loggerResolver.use(this.transportName);
    }

    debug(messages: Array<unknown>, extraInfo?: LogExtraInfo): void {
        this.getLogger().debug(messages, extraInfo);
    }

    verbose(messages: Array<unknown>, extraInfo?: LogExtraInfo): void {
        this.getLogger().verbose(messages, extraInfo);
    }

    info(messages: Array<unknown>, extraInfo?: LogExtraInfo): void {
        this.getLogger().info(messages, extraInfo);
    }

    warn(messages: Array<unknown>, extraInfo?: FailureLogExtraInfo): void {
        this.getLogger().warn(messages, extraInfo);
    }

    error(messages: Array<unknown>, extraInfo?: FailureLogExtraInfo): void {
        this.getLogger().error(messages, extraInfo);
    }

    fatal(messages: Array<unknown>, extraInfo?: FailureLogExtraInfo): void {
        this.getLogger().fatal(messages, extraInfo);
    }

    run<TValue = void>(
        invocable: Lazy<TValue>,
        settings?: RunLogSettings,
    ): TValue {
        return this.getLogger().run(invocable, settings);
    }

    putMetadata(values: Partial<Record<string, unknown>>): void;
    putMetadata(key: string, value: unknown): void;
    putMetadata(
        keyOrValue: string | Partial<Record<string, unknown>>,
        value?: unknown,
    ): void {
        if (typeof keyOrValue === "string") {
            this.getLogger().putMetadata(keyOrValue, value);
            return;
        }
        this.getLogger().putMetadata(keyOrValue);
    }
}
