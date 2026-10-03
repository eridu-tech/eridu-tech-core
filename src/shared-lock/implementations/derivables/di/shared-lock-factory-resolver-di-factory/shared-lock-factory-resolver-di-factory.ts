/**
 * @module SharedLock
 */

import { DiSharedLockFactoryResolver } from "@/shared-lock/implementations/derivables/di/shared-lock-factory-resolver-di-factory/di-shared-lock-factory-resolver.js";

import type { DiToken, IContainer } from "@/di/contracts/_module-exports.js";
import type { ISharedLockFactoryResolver } from "@/shared-lock/contracts/_module-exports.js";

/**
 * Creates an {@link ISharedLockFactoryResolver} that resolves the underlying
 * resolver from a dependency-injection container.
 *
 * The token is resolved once by {@link IContainer.init}, then
 * `use()` and `create()` delegate to the real resolver.
 * Until `init()` is awaited, `use()` and `create()` throw,
 * meaning you need to call `sharedLockFactoryResolverDiFactory` before `init()`.

 * @template TAdapters - Union type of the registered adapter names.
 * @param container - The container the shared lock factory resolver is resolved
 *        from.
 * @param sharedLockFactoryResolverToken - The token the resolver is registered
 *        under.
 * @returns A resolver proxy; await its `ready()` before use.
 * @throws {@link CanNotResolveServiceDiError} From `ready()` when the token is
 *         not registered.
 *
 * IMPORT_PATH: `"eridu-tech/shared-lock/di"`
 * @group Derivables
 */
export function sharedLockFactoryResolverDiFactory<
    TAdapters extends string = string,
>(
    container: IContainer,
    sharedLockFactoryResolverToken: DiToken<
        ISharedLockFactoryResolver<TAdapters>
    >,
): DiSharedLockFactoryResolver<TAdapters> {
    return new DiSharedLockFactoryResolver(
        container,
        sharedLockFactoryResolverToken,
    );
}
