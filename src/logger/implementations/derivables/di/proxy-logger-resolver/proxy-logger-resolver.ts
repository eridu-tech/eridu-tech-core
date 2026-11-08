/**
 * @module Observability
 */

import { ProxyLogger } from "@/logger/implementations/derivables/di/proxy-logger-resolver/proxy-logger.js";

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
 * Settings used to construct a {@link ProxyLoggerResolver}.
 *
 * IMPORT_PATH: `"eridu-tech/logger/di"`
 * @group Derivables
 */
export type ProxyLoggerResolverSettings<TTransports extends string = string> = {
    /**
     * Resolver used to look up the underlying logger resolver.
     */
    container: Pick<IServiceResolver, "resolveOrFail">;

    /**
     * Token of the {@link ILoggerResolver} to resolve.
     */
    resolverToken: DiToken<ILoggerResolver<TTransports>>;
};

/**
 * An {@link ILoggerResolver} and {@link ILogger} that resolve the underlying
 * resolver from a dependency-injection container.
 *
 * Construct the proxy with a {@link ProxyLoggerResolverSettings}.
 *
 * The `resolverToken` is resolved through the container on every operation via
 * {@link IServiceResolver.resolveOrFail}, and the operation is then delegated
 * to the resolved {@link ILoggerResolver}. Because resolution happens lazily,
 * every `LIFETIME` is supported:
 *
 * - `SINGLETON` and `SCOPED` registrations share one resolver instance, so
 *   `span` and `scopedMetadata` scopes created by different callers line up.
 * - `TRANSIENT` registrations create a new resolver per operation. Each resolver
 *   owns its own loggers and context tokens, so spans and metadata written
 *   through one operation are invisible to the next. Prefer `SINGLETON` or
 *   `SCOPED`.
 *
 * `use()` returns a lightweight {@link ILogger} that performs the same
 * per-operation resolution and forwards each logger method to the logger of
 * the selected transport alias.
 *
 * @template TTransports - Union type of the registered transport names.
 *
 * IMPORT_PATH: `"eridu-tech/logger/di"`
 * @group Derivables
 */
export class ProxyLoggerResolver<TTransports extends string = string>
    implements ILogger, ILoggerResolver<TTransports>
{
    private readonly container: Pick<IServiceResolver, "resolveOrFail">;
    private readonly resolverToken: DiToken<ILoggerResolver<TTransports>>;

    constructor(settings: ProxyLoggerResolverSettings<TTransports>) {
        this.container = settings.container;
        this.resolverToken = settings.resolverToken;
    }

    /**
     * Returns a logger that resolves the logger resolver and selects
     * `transportName` on every operation.
     *
     * @param transportName - The alias to select. Defaults to the resolver's
     * `defaultTransport`.
     * @returns A logger bound to the selected transport alias.
     */
    use(transportName?: TTransports): ILogger {
        return new ProxyLogger(
            this.container,
            this.resolverToken,
            transportName,
        );
    }

    debug(...messages: Array<unknown>): void {
        this.use().debug(...messages);
    }

    verbose(...messages: Array<unknown>): void {
        this.use().verbose(...messages);
    }

    info(...messages: Array<unknown>): void {
        this.use().info(...messages);
    }

    warn(...messages: Array<unknown>): void {
        this.use().warn(...messages);
    }

    error(...messages: Array<unknown>): void {
        this.use().error(...messages);
    }

    fatal(...messages: Array<unknown>): void {
        this.use().fatal(...messages);
    }

    span<TValue>(name: string, invocable: Lazy<TValue>): TValue {
        return this.use().span(name, invocable);
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
            return this.use().scopedMetadata(
                valuesOrKey,
                valueOrInvocable,
                invocable as Lazy<TValue>,
            );
        }
        return this.use().scopedMetadata(
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
            this.use().putMetadata(keyOrValue, value);
            return;
        }
        this.use().putMetadata(keyOrValue);
    }
}
