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
import type { IInitizable } from "@/utilities/_module-exports.js";

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
export class FileStorageResolver<TAdapters extends string = string>
    implements IFileStorageResolver<TAdapters>, IInitizable
{
    constructor(
        private readonly settings: FileStorageResolverSettings<TAdapters>,
    ) {}

    private readonly factories = {} as Partial<Record<TAdapters, FileStorage>>;

    async init(): Promise<void> {
        const { adapters, ...rest } = this.settings;
        for (const adapterName in adapters) {
            const adapter = this.settings.adapters[adapterName];
            if (adapter === undefined) {
                continue;
            }
            const factory = new FileStorage({
                ...rest,
                adapter,
                serializationId: adapterName,
            });
            await factory.init();
            this.factories[adapterName] = factory;
        }
        return Promise.resolve();
    }

    use(
        adapterName: TAdapters | undefined = this.settings.defaultAdapter,
    ): IFileStorage {
        if (adapterName === undefined) {
            throw new DefaultAdapterNotDefinedError(
                FileStorage.name,
                Object.keys(this.settings.adapters),
            );
        }
        const factory = this.factories[adapterName];
        if (factory === undefined) {
            throw new UnregisteredAdapterError(
                adapterName,
                Object.keys(this.settings.adapters),
            );
        }
        return factory;
    }
}
