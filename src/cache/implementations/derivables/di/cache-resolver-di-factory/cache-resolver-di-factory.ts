/**
 * @module Cache
 */

import { DiCacheResolver } from "@/cache/implementations/derivables/di/cache-resolver-di-factory/di-cache-resolver.js";

import type { ICacheResolver } from "@/cache/contracts/cache-resolver.contract.js";
import type { ICache } from "@/cache/contracts/cache.contract.js";
import type { DiToken, IContainer } from "@/di/contracts/_module-exports.js";

/**
 * Creates an {@link ICacheResolver} that resolves the underlying resolver from a
 * dependency-injection container.
 *
 * The token is resolved once by {@link IContainer.init},
 * then `use()` and the cache operations methods delegate to the real resolver.
 * Until `init()` is awaited, `use()` and cache operations methods throw,
 * meaning you need to call `cacheResolverDiFactory` before `init()`.

 * @template TAdapters - Union type of the registered adapter names.
 * @template TType - The type of values cached.
 * @param container - The container the cache resolver is resolved from.
 * @param cacheResolverToken - The token the cache resolver is registered under.
 * @returns A resolver proxy; await `IContainer.init()` before use.
 * @throws {@link CanNotResolveServiceDiError} During `IContainer.init()` when the
 *         token is not registered.
 *
 * IMPORT_PATH: `"eridu-tech/cache/di"`
 * @group Derivables
 */
export function cacheResolverDiFactory<
    TAdapters extends string = string,
    TType = unknown,
>(
    container: IContainer,
    cacheResolverToken: DiToken<ICacheResolver<TAdapters, TType>>,
): ICacheResolver<TAdapters, TType> & ICache<TType> {
    return new DiCacheResolver(container, cacheResolverToken);
}
