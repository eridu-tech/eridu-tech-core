/**
 * @module RateLimiter
 */

import { DiRateLimiterFactoryResolver } from "@/rate-limiter/implementations/derivables/di/rate-limiter-factory-resolver-di-factory/di-rate-limiter-factory-resolver.js";

import type { DiToken, IContainer } from "@/di/contracts/_module-exports.js";
import type { IRateLimiterFactoryResolver } from "@/rate-limiter/contracts/_module-exports.js";

/**
 * Creates an {@link IRateLimiterFactoryResolver} that resolves the underlying
 * resolver from a dependency-injection container.
 *
 * The token is resolved once by {@link IContainer.init}, then
 * `use()` and `create()` delegate to the real resolver.
 * Until `init()` is awaited, `use()` and `create()` throw,
 * meaning you need to call `rateLimiterFactoryResolverDiFactory` before `init()`.

 * @template TAdapters - Union type of the registered adapter names.
 * @param container - The container the rate limiter factory resolver is resolved
 *        from.
 * @param rateLimiterFactoryResolverToken - The token the resolver is registered
 *        under.
 * @returns A resolver proxy; await its `ready()` before use.
 * @throws {@link CanNotResolveServiceDiError} From `ready()` when the token is
 *         not registered.
 *
 * IMPORT_PATH: `"eridu-tech/rate-limiter/di"`
 * @group Derivables
 */
export function rateLimiterFactoryResolverDiFactory<
    TAdapters extends string = string,
>(
    container: IContainer,
    rateLimiterFactoryResolverToken: DiToken<
        IRateLimiterFactoryResolver<TAdapters>
    >,
): DiRateLimiterFactoryResolver<TAdapters> {
    return new DiRateLimiterFactoryResolver(
        container,
        rateLimiterFactoryResolverToken,
    );
}
