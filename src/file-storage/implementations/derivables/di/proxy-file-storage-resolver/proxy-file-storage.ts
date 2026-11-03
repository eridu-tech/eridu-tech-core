/**
 * @module FileStorage
 */

import { ProxyFile } from "@/file-storage/implementations/derivables/di/proxy-file-storage-resolver/proxy-file.js";

import type {
    DiToken,
    IServiceResolver,
} from "@/di/contracts/_module-exports.js";
import type {
    IFile,
    IFileStorage,
    IFileStorageResolver,
} from "@/file-storage/contracts/_module-exports.js";

/**
 * @internal
 */
export class ProxyFileStorage<
    TAdapters extends string = string,
> implements IFileStorage {
    constructor(
        private readonly container: Pick<IServiceResolver, "resolveOrFail">,
        private readonly resolverToken: DiToken<
            IFileStorageResolver<TAdapters>
        >,
        private readonly adapterName: TAdapters | undefined,
    ) {}

    private getFileStorage(): IFileStorage {
        const fileStorageResolver = this.container.resolveOrFail(
            this.resolverToken,
        );
        return fileStorageResolver.use(this.adapterName);
    }

    create(key: string): IFile {
        return new ProxyFile(
            this.container,
            this.resolverToken,
            this.adapterName,
            key,
        );
    }

    async clear(): Promise<void> {
        return this.getFileStorage().clear();
    }

    async removeMany(files: Array<IFile>): Promise<void> {
        return this.getFileStorage().removeMany(files);
    }
}
