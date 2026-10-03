/**
 * @module Semaphore
 */

import { DiSemaphoreFactoryResolver } from "@/semaphore/implementations/derivables/di/semaphore-factory-resolver-di-factory/di-semaphore-factory-resolver.js";

import type { DiToken, IContainer } from "@/di/contracts/_module-exports.js";
import type { ISemaphoreFactoryResolver } from "@/semaphore/contracts/_module-exports.js";

/**
 * Creates an {@link ISemaphoreFactoryResolver} that resolves the underlying
 * resolver from a dependency-injection container.
 *
 * The token is resolved once by {@link IContainer.init}, then
 * `use()` and `create()` delegate to the real resolver.
 * Until `init()` is awaited, `use()` and `create()` throw,
 * meaning you need to call `semaphoreFactoryResolverDiFactory` before `init()`.

 * @template TAdapters - Union type of the registered adapter names.
 * @param container - The container the semaphore factory resolver is resolved
 *        from.
 * @param semaphoreFactoryResolverToken - The token the resolver is registered
 *        under.
 * @returns A resolver proxy; await its `ready()` before use.
 * @throws {@link CanNotResolveServiceDiError} From `ready()` when the token is
 *         not registered.
 *
 * IMPORT_PATH: `"eridu-tech/semaphore/di"`
 * @group Derivables
 */
export function semaphoreFactoryResolverDiFactory<
    TAdapters extends string = string,
>(
    container: IContainer,
    semaphoreFactoryResolverToken: DiToken<
        ISemaphoreFactoryResolver<TAdapters>
    >,
): DiSemaphoreFactoryResolver<TAdapters> {
    return new DiSemaphoreFactoryResolver(
        container,
        semaphoreFactoryResolverToken,
    );
}
