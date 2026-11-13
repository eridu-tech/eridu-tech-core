/**
 * @module Logger
 */

import { ProxyLog } from "@/log/implementations/derivables/di/proxy-log-resolver/proxy-log.js";

import type {
    DiToken,
    IServiceResolver,
} from "@/di/contracts/_module-exports.js";
import type {
    FailureLogExtraInfo,
    ILog,
    ILogResolver,
    LogExtraInfo,
    RunLogSettings,
} from "@/log/contracts/_module-exports.js";
import type { Lazy } from "@/utilities/_module-exports.js";

/**
 * Settings used to construct a {@link ProxyLogResolver}.
 *
 * IMPORT_PATH: `"eridu-tech/logger/di"`
 * @group Derivables
 */
export type ProxyLogResolverSettings<TTransports extends string = string> = {
    /**
     * Resolver used to look up the underlying log resolver.
     */
    container: Pick<IServiceResolver, "resolveOrFail">;

    /**
     * Token of the {@link ILogResolver} to resolve.
     */
    resolverToken: DiToken<ILogResolver<TTransports>>;
};

/**
 * An {@link ILogResolver} and {@link ILog} that resolve the underlying
 * resolver from a dependency-injection container.
 *
 * Construct the proxy with a {@link ProxyLogResolverSettings}.
 *
 * The `resolverToken` is resolved through the container on every operation via
 * {@link IServiceResolver.resolveOrFail}, and the operation is then delegated
 * to the resolved {@link ILogResolver}. Because resolution happens lazily,
 * every `LIFETIME` is supported:
 *
 * - `SINGLETON` and `SCOPED` registrations share one resolver instance, so
 *   `run` scopes created by different callers line up.
 * - `TRANSIENT` registrations create a new resolver per operation. Each resolver
 *   owns its own logs and context tokens, so spans and metadata written
 *   through one operation are invisible to the next. Prefer `SINGLETON` or
 *   `SCOPED`.
 *
 * `use()` returns a lightweight {@link ILog} that performs the same
 * per-operation resolution and forwards each log method to the log of
 * the selected transport alias.
 *
 * @template TTransports - Union type of the registered transport names.
 *
 * IMPORT_PATH: `"eridu-tech/logger/di"`
 * @group Derivables
 */
export class ProxyLogResolver<TTransports extends string = string>
    implements ILog, ILogResolver<TTransports>
{
    private readonly container: Pick<IServiceResolver, "resolveOrFail">;
    private readonly resolverToken: DiToken<ILogResolver<TTransports>>;

    constructor(settings: ProxyLogResolverSettings<TTransports>) {
        this.container = settings.container;
        this.resolverToken = settings.resolverToken;
    }

    use(transportName?: TTransports): ILog {
        return new ProxyLog(this.container, this.resolverToken, transportName);
    }

    debug(messages: Array<unknown>, extraInfo?: LogExtraInfo): void {
        this.use().debug(messages, extraInfo);
    }

    verbose(messages: Array<unknown>, extraInfo?: LogExtraInfo): void {
        this.use().verbose(messages, extraInfo);
    }

    info(messages: Array<unknown>, extraInfo?: LogExtraInfo): void {
        this.use().info(messages, extraInfo);
    }

    warn(messages: Array<unknown>, extraInfo?: FailureLogExtraInfo): void {
        this.use().warn(messages, extraInfo);
    }

    error(messages: Array<unknown>, extraInfo?: FailureLogExtraInfo): void {
        this.use().error(messages, extraInfo);
    }

    fatal(messages: Array<unknown>, extraInfo?: FailureLogExtraInfo): void {
        this.use().fatal(messages, extraInfo);
    }

    run<TValue = void>(
        invocable: Lazy<TValue>,
        settings?: RunLogSettings,
    ): TValue {
        return this.use().run(invocable, settings);
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
