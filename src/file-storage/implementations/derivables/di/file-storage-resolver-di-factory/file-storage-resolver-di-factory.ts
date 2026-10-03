/**
 * @module FileStorage
 */

import { DiFileStorageResolver } from "@/file-storage/implementations/derivables/di/file-storage-resolver-di-factory/di-file-storage-resolver.js";

import type { DiToken, IContainer } from "@/di/contracts/_module-exports.js";
import type { IFileStorageResolver } from "@/file-storage/contracts/_module-exports.js";

/**
 * Creates an {@link IFileStorageResolver} that resolves the underlying resolver
 * from a dependency-injection container.
 *
 * The token is resolved once by {@link DiFileStorageResolver.ready}, then `use()`
 * and `create()` delegate to the real resolver.
 * Until `init()` is awaited, `use()` and `create()` throw,
 * meaning you need to call `fileStorageResolverDiFactory` before `init()`.

 * @template TAdapters - Union type of the registered adapter names.
 * @param container - The container the file storage resolver is resolved from.
 * @param fileStorageResolverToken - The token the resolver is registered under.
 * @returns A resolver proxy; await its `ready()` before use.
 * @throws {@link CanNotResolveServiceDiError} From `ready()` when the token is
 *         not registered.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/di"`
 * @group Derivables
 */
export function fileStorageResolverDiFactory<TAdapters extends string = string>(
    container: IContainer,
    fileStorageResolverToken: DiToken<IFileStorageResolver<TAdapters>>,
): DiFileStorageResolver<TAdapters> {
    return new DiFileStorageResolver(container, fileStorageResolverToken);
}
