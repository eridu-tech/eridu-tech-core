/**
 * @module Lock
 */

import { DiLockFactoryResolver } from "@/lock/implementations/derivables/di/lock-factory-resolver-di-factory/di-lock-factory-resolver.js";

import type { DiToken, IContainer } from "@/di/contracts/_module-exports.js";
import type { ILockFactoryResolver } from "@/lock/contracts/_module-exports.js";

/**
 * Creates an {@link ILockFactoryResolver} that resolves the underlying resolver
 * from a dependency-injection container.
 *
 * The token is resolved once by {@link IContainer.init}, then `use()`
 * and `create()` delegate to the real resolver.
 * Until `init()` is awaited, `use()` and `create()` throw,
 * meaning you need to call `lockFactoryResolverDiFactory` before `init()`.

 * @template TAdapters - Union type of the registered adapter names.
 * @param container - The container the lock factory resolver is resolved from.
 * @param lockFactoryResolverToken - The token the resolver is registered under.
 * @returns A resolver proxy; await its `ready()` before use.
 * @throws {@link CanNotResolveServiceDiError} From `ready()` when the token is
 *         not registered.
 *
 * IMPORT_PATH: `"eridu-tech/lock/di"`
 * @group Derivables
 */
export function lockFactoryResolverDiFactory<TAdapters extends string = string>(
    container: IContainer,
    lockFactoryResolverToken: DiToken<ILockFactoryResolver<TAdapters>>,
): DiLockFactoryResolver<TAdapters> {
    return new DiLockFactoryResolver(container, lockFactoryResolverToken);
}
