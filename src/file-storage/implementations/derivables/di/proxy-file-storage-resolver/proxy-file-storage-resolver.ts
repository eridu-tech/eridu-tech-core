/**
 * @module FileStorage
 */

import type {
    DiToken,
    IContainerHooks,
} from "@/di/contracts/_module-exports.js";
import type {
    IFile,
    IFileStorage,
    IFileStorageResolver,
} from "@/file-storage/contracts/_module-exports.js";

/**
 * An {@link IFileStorageResolver} and {@link IFileStorage} that resolve the underlying
 * resolver from a dependency-injection container.
 *
 * The token is resolved once by {@link IContainer.init}, after which `use()` and the
 * file storage operations delegate to the real resolver. Construct the instance before
 * `init()`; calling `use()` or a file storage operation before `init()` is awaited
 * throws.
 *
 * @template TAdapters - Union type of the registered adapter names.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/di"`
 * @group Derivables
 */
export class ProxyFileStorageResolver<TAdapters extends string = string>
    implements IFileStorageResolver<TAdapters>, IFileStorage
{
    private resolver: IFileStorageResolver<TAdapters> | null = null;

    constructor(
        container: Pick<IContainerHooks, "onInit">,
        resolverToken: DiToken<IFileStorageResolver<TAdapters>>,
    ) {
        container.onInit({ resolver: resolverToken }, (deps) => {
            this.resolver = deps.resolver;
        });
    }

    private getResolver(): IFileStorageResolver<TAdapters> {
        if (this.resolver === null) {
            throw new Error(
                "ProxyFileStorageResolver is not ready. Await IContainer.init() before use.",
            );
        }
        return this.resolver;
    }

    use(adapterName?: TAdapters): IFileStorage {
        return this.getResolver().use(adapterName);
    }

    create(key: string): IFile {
        return this.use().create(key);
    }

    clear(): Promise<void> {
        return this.use().clear();
    }

    removeMany(files: Array<IFile>): Promise<boolean> {
        return this.use().removeMany(files);
    }
}
