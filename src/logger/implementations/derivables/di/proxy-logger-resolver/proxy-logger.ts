/**
 * @module Observability
 */

import type {
    DiToken,
    IServiceResolver,
} from "@/di/contracts/_module-exports.js";
import type {
    ILogger,
    ILoggerResolver,
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

    debug(...messages: Array<unknown>): void {
        this.getLogger().debug(...messages);
    }

    verbose(...messages: Array<unknown>): void {
        this.getLogger().verbose(...messages);
    }

    info(...messages: Array<unknown>): void {
        this.getLogger().info(...messages);
    }

    warn(...messages: Array<unknown>): void {
        this.getLogger().warn(...messages);
    }

    error(...messages: Array<unknown>): void {
        this.getLogger().error(...messages);
    }

    fatal(...messages: Array<unknown>): void {
        this.getLogger().fatal(...messages);
    }

    span<TValue>(name: string, invocable: Lazy<TValue>): TValue {
        return this.getLogger().span(name, invocable);
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
            return this.getLogger().scopedMetadata(
                valuesOrKey,
                valueOrInvocable,
                invocable as Lazy<TValue>,
            );
        }
        return this.getLogger().scopedMetadata(
            valuesOrKey,
            valueOrInvocable as Lazy<TValue>,
        );
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
