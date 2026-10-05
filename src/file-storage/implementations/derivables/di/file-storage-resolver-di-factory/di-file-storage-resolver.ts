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
 * @internal
 */
export class DiFileStorageResolver<TAdapters extends string = string>
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
                "DiFileStorageResolver is not ready. Await ready() before use.",
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
