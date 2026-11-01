/**
 * @module CircuitBreaker
 */

import { ProxyCircuitBreakerFactory } from "@/circuit-breaker/implementations/derivables/di/proxy-circuit-breaker-factory-resolver/proxy-circuit-breaker-factory.js";

import type {
    CircuitBreakerFactoryCreateSettings,
    ICircuitBreaker,
    ICircuitBreakerFactory,
    ICircuitBreakerFactoryResolver,
} from "@/circuit-breaker/contracts/_module-exports.js";
import type {
    DiToken,
    IServiceResolver,
} from "@/di/contracts/_module-exports.js";

/**
 * Settings used to construct a {@link ProxyCircuitBreakerFactoryResolver}.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/di"`
 * @group Derivables
 */
export type ProxyCircuitBreakerFactoryResolverSettings<
    TAdapters extends string = string,
> = {
    container: Pick<IServiceResolver, "resolveOrFail">;
    resolverToken: DiToken<ICircuitBreakerFactoryResolver<TAdapters>>;
};

/**
 * An {@link ICircuitBreakerFactoryResolver} and {@link ICircuitBreakerFactory} that
 * resolve the underlying resolver from a dependency-injection container.
 *
 * Construct the proxy with a
 * {@link ProxyCircuitBreakerFactoryResolverSettings}.
 *
 * The `resolverToken` is resolved through the container on every operation via
 * {@link IServiceResolver.resolveOrFail}, and the operation is then delegated to the
 * resolved {@link ICircuitBreakerFactoryResolver}. Because resolution happens lazily,
 * every `LIFETIME` is supported:
 *
 * - `SINGLETON` and `TRANSIENT` registrations can be used once
 *   `IContainer.init()` has been awaited.
 * - `SCOPED` registrations are resolved per operation, so the proxy must be used
 *   inside `IContainer.run()`; resolving it outside of a scope throws.
 *
 * `use()` returns a lightweight {@link ICircuitBreakerFactory} whose circuit
 * breakers resolve the resolver when one of their operations is invoked.
 *
 * @template TAdapters - Union type of the registered adapter names.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/di"`
 * @group Derivables
 */
export class ProxyCircuitBreakerFactoryResolver<
    TAdapters extends string = string,
>
    implements ICircuitBreakerFactoryResolver<TAdapters>, ICircuitBreakerFactory
{
    private readonly container: Pick<IServiceResolver, "resolveOrFail">;
    private readonly resolverToken: DiToken<
        ICircuitBreakerFactoryResolver<TAdapters>
    >;

    constructor(
        settings: ProxyCircuitBreakerFactoryResolverSettings<TAdapters>,
    ) {
        this.container = settings.container;
        this.resolverToken = settings.resolverToken;
    }

    use(adapterName?: TAdapters): ICircuitBreakerFactory {
        return new ProxyCircuitBreakerFactory(
            this.container,
            this.resolverToken,
            adapterName,
        );
    }

    create(
        key: string,
        settings?: CircuitBreakerFactoryCreateSettings,
    ): ICircuitBreaker {
        return this.use().create(key, settings);
    }
}
