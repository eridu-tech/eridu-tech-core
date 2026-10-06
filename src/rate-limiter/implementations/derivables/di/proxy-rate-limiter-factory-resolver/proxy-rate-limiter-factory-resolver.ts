/**
 * @module RateLimiter
 */

import { ProxyRateLimiterFactory } from "@/rate-limiter/implementations/derivables/di/proxy-rate-limiter-factory-resolver/proxy-rate-limiter-factory.js";

import type {
    DiToken,
    IServiceResolver,
} from "@/di/contracts/_module-exports.js";
import type {
    IRateLimiter,
    IRateLimiterFactory,
    IRateLimiterFactoryResolver,
    RateLimiterFactoryCreateSettings,
} from "@/rate-limiter/contracts/_module-exports.js";

/**
 * Settings used to construct a {@link ProxyRateLimiterFactoryResolver}.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/di"`
 * @group Derivables
 */
export type ProxyRateLimiterFactoryResolverSettings<
    TAdapters extends string = string,
> = {
    container: Pick<IServiceResolver, "resolveOrFail">;
    resolverToken: DiToken<IRateLimiterFactoryResolver<TAdapters>>;
};

/**
 * An {@link IRateLimiterFactoryResolver} and {@link IRateLimiterFactory} that resolve
 * the underlying resolver from a dependency-injection container.
 *
 * Construct the proxy with a {@link ProxyRateLimiterFactoryResolverSettings}.
 *
 * The `resolverToken` is resolved through the container on every operation via
 * {@link IServiceResolver.resolveOrFail}, and the operation is then delegated to the
 * resolved {@link IRateLimiterFactoryResolver}. Because resolution happens lazily,
 * every `LIFETIME` is supported:
 *
 * - `SINGLETON` and `TRANSIENT` registrations can be used once
 *   `IContainer.init()` has been awaited.
 * - `SCOPED` registrations are resolved per operation, so the proxy must be used
 *   inside `IContainer.run()`; resolving it outside of a scope throws.
 *
 * `use()` returns a lightweight {@link IRateLimiterFactory} whose rate limiters
 * resolve the resolver when one of their operations is invoked.
 *
 * @template TAdapters - Union type of the registered adapter names.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/di"`
 * @group Derivables
 */
export class ProxyRateLimiterFactoryResolver<TAdapters extends string = string>
    implements IRateLimiterFactoryResolver<TAdapters>, IRateLimiterFactory
{
    private readonly container: Pick<IServiceResolver, "resolveOrFail">;
    private readonly resolverToken: DiToken<
        IRateLimiterFactoryResolver<TAdapters>
    >;

    constructor(settings: ProxyRateLimiterFactoryResolverSettings<TAdapters>) {
        this.container = settings.container;
        this.resolverToken = settings.resolverToken;
    }

    use(adapterName?: TAdapters): IRateLimiterFactory {
        return new ProxyRateLimiterFactory(
            this.container,
            this.resolverToken,
            adapterName,
        );
    }

    create(
        key: string,
        settings: RateLimiterFactoryCreateSettings,
    ): IRateLimiter {
        return this.use().create(key, settings);
    }
}
