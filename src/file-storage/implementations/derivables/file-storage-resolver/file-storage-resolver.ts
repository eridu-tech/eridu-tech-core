/**
 * @module FileStorage
 */

import { FileStorage } from "@/file-storage/implementations/derivables/file-storage/_module.js";
import {
    DefaultAdapterNotDefinedError,
    UnregisteredAdapterError,
} from "@/utilities/_module-exports.js";

import type {
    IFileStorage,
    ISignedFileStorageAdapter,
    IFileStorageResolver,
} from "@/file-storage/contracts/_module-exports.js";
import type { FileStorageSettingsBase } from "@/file-storage/implementations/derivables/file-storage/_module.js";

/**
 * IMPORT_PATH: `"eridu-tech/file-storage"`
 * @group Derivables
 */
export type FileStorageAdapters<TAdapters extends string = string> = Partial<
    Record<TAdapters, ISignedFileStorageAdapter>
>;

/**
 * Configuration for `FileStorageResolver`.
 * Registers named file-storage adapters and optionally designates a default.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage"`
 * @group Derivables
 */
export type FileStorageResolverSettings<TAdapters extends string = string> =
    FileStorageSettingsBase & {
        /**
         * Named registry of file-storage adapters. Each key is an adapter alias and the corresponding value is the adapter instance.
         */
        adapters: FileStorageAdapters<TAdapters>;

        /**
         * The alias of the adapter to use when none is explicitly specified. Must be a key in the `adapters` map.
         */
        defaultAdapter?: NoInfer<TAdapters>;
    };

/**
 * IMPORT_PATH: `"eridu-tech/file-storage"`
 * @group Derivables
 */
export class FileStorageResolver<
    TAdapters extends string = string,
> implements IFileStorageResolver<TAdapters> {
    constructor(
        private readonly settings: FileStorageResolverSettings<TAdapters>,
    ) {}

    setDefaultContentDisposition(
        contentDisposition: string | null,
    ): FileStorageResolver<TAdapters> {
        return new FileStorageResolver({
            ...this.settings,
            defaultContentDisposition: contentDisposition,
        });
    }

    setDefaultContentEncoding(
        contentEncoding: string | null,
    ): FileStorageResolver<TAdapters> {
        return new FileStorageResolver({
            ...this.settings,
            defaultContentEncoding: contentEncoding,
        });
    }

    setDefaultCacheControl(
        cacheControl: string | null,
    ): FileStorageResolver<TAdapters> {
        return new FileStorageResolver({
            ...this.settings,
            defaultCacheControl: cacheControl,
        });
    }

    setDefaultContentLanguage(
        contentLanguage: string | null,
    ): FileStorageResolver<TAdapters> {
        return new FileStorageResolver({
            ...this.settings,
            defaultContentLanguage: contentLanguage,
        });
    }

    use(
        adapterName: TAdapters | undefined = this.settings.defaultAdapter,
    ): IFileStorage {
        if (adapterName === undefined) {
            throw new DefaultAdapterNotDefinedError(
                FileStorageResolver.name,
                Object.keys(this.settings.adapters),
            );
        }
        const adapter = this.settings.adapters[adapterName];
        if (adapter === undefined) {
            throw new UnregisteredAdapterError(
                adapterName,
                Object.keys(this.settings.adapters),
            );
        }
        return new FileStorage({
            ...this.settings,
            adapter,
            serializationId: adapterName,
        });
    }
}
