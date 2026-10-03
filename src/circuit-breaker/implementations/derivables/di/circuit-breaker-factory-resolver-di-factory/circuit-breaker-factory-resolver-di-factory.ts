/**
 * @module CircuitBreaker
 */

import { DiCircuitBreakerFactoryResolver } from "@/circuit-breaker/implementations/derivables/di/circuit-breaker-factory-resolver-di-factory/di-circuit-breaker-factory-resolver.js";

import type { ICircuitBreakerFactoryResolver } from "@/circuit-breaker/contracts/_module-exports.js";
import type { DiToken, IContainer } from "@/di/contracts/_module-exports.js";

/**
 * Creates an {@link ICircuitBreakerFactoryResolver} that resolves the underlying
 * resolver from a dependency-injection container.
 *
 * The token is resolved once by {@link IContainer.init},
 * then `use()` and `create()` delegate to the real resolver.
 * Until `init()` is awaited, `use()` and `create()` throw,
 * meaning you need to call `circuitBreakerFactoryResolverDiFactory` before `init()`.
 *
 * @template TAdapters - Union type of the registered adapter names.
 * @param container - The container the circuit breaker factory resolver is
 *        resolved from.
 * @param circuitBreakerFactoryResolverToken - The token the resolver is
 *        registered under.
 * @returns A resolver proxy; await `IContainer.init()` before use.
 * @throws {@link CanNotResolveServiceDiError} During `IContainer.init()` when the
 *         token is not registered.
 *
 * IMPORT_PATH: `"eridu-tech/circuit-breaker/di"`
 * @group Derivables
 */
export function circuitBreakerFactoryResolverDiFactory<
    TAdapters extends string = string,
>(
    container: IContainer,
    circuitBreakerFactoryResolverToken: DiToken<
        ICircuitBreakerFactoryResolver<TAdapters>
    >,
): DiCircuitBreakerFactoryResolver<TAdapters> {
    return new DiCircuitBreakerFactoryResolver(
        container,
        circuitBreakerFactoryResolverToken,
    );
}
