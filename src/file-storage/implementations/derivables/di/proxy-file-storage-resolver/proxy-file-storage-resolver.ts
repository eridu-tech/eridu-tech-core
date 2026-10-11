/**
 * @module FileStorage
 */

import { ProxyFileStorage } from "@/file-storage/implementations/derivables/di/proxy-file-storage-resolver/proxy-file-storage.js";

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
 * Settings used to construct a {@link ProxyFileStorageResolver}.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/di"`
 * @group Derivables
 */
export type ProxyFileStorageResolverSettings<
    TAdapters extends string = string,
> = {
    container: Pick<IServiceResolver, "resolveOrFail">;
    resolverToken: DiToken<IFileStorageResolver<TAdapters>>;
};

/**
 * An {@link IFileStorageResolver} and {@link IFileStorage} that resolve the underlying
 * resolver from a dependency-injection container.
 *
 * Construct the proxy with a {@link ProxyFileStorageResolverSettings}.
 *
 * The `resolverToken` is resolved through the container on every operation via
 * {@link IServiceResolver.resolveOrFail}, and the operation is then delegated to the
 * resolved {@link IFileStorageResolver}. Because resolution happens lazily, every
 * `LIFETIME` is supported:
 *
 * - `SINGLETON` and `TRANSIENT` registrations can be used once
 *   `IContainer.init()` has been awaited.
 * - `SCOPED` registrations are resolved per operation, so the proxy must be used
 *   inside `IContainer.run()`; resolving it outside of a scope throws.
 *
 * `use()` returns a lightweight {@link IFileStorage} whose files resolve the resolver
 * when one of their operations is invoked.
 *
 * @template TAdapters - Union type of the registered adapter names.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/di"`
 * @group Derivables
 */
export class ProxyFileStorageResolver<TAdapters extends string = string>
    implements IFileStorageResolver<TAdapters>, IFileStorage
{
    private readonly container: Pick<IServiceResolver, "resolveOrFail">;
    private readonly resolverToken: DiToken<IFileStorageResolver<TAdapters>>;

    constructor(settings: ProxyFileStorageResolverSettings<TAdapters>) {
        this.container = settings.container;
        this.resolverToken = settings.resolverToken;
    }

    use(adapterName?: TAdapters): IFileStorage {
        return new ProxyFileStorage(
            this.container,
            this.resolverToken,
            adapterName,
        );
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
