/**
 * @module FileStorage
 */

import { FileSerdeTransformer } from "@/file-storage/implementations/derivables/file-storage/file-serde-transformer.js";
import { File } from "@/file-storage/implementations/derivables/file-storage/file.js";
import { NoOpSerdeAdapter } from "@/serde/implementations/adapters/no-op-serde-adapter/_module-exports.js";
import { Serde } from "@/serde/implementations/derivables/_module-exports.js";
import {
    CORE,
    resolveOneOrMore,
    resolveSerdeTransformerName,
} from "@/utilities/_module-exports.js";

import type {
    IFile,
    IFileStorage,
    ISignedFileStorageAdapter,
} from "@/file-storage/contracts/_module-exports.js";
import type { ISerdeRegister } from "@/serde/contracts/_module-exports.js";
import type { OneOrMore } from "@/utilities/_module-exports.js";

/**
 * IMPORT_PATH: `"eridu-tech/file-storage"`
 * @group Derivables
 */
export type FileStorageSettingsBase = {
    /**
     * Note this setting is only used by cloud object storage services like aws s3, azure, or google cloud storage.
     *
     * @default "inline"
     */
    defaultContentDisposition?: string | null;

    /**
     * Note this setting is only used by cloud object storage services like aws s3, azure, or google cloud storage.
     *
     * @default null
     */
    defaultContentEncoding?: string | null;

    /**
     * Note this setting is only used by cloud object storage services like aws s3, azure, or google cloud storage.
     *
     * @default ""
     */
    defaultCacheControl?: string | null;

    /**
     * Note this setting is only used by cloud object storage services like aws s3, azure, or google cloud storage.
     *
     * @default null
     */
    defaultContentLanguage?: string | null;

    /**
     * You can pass an {@link ISerdeRegister | `ISerderRegister`} instance to the {@link FileStorage | `FileStorage`} to register the file's serialization and deserialization logic for the provided adapter.
     * @default
     * ```ts
     * import { Serde } from "eridu-tech/serde";
     * import { NoOpSerdeAdapter } from "eridu-tech/serde/no-op-serde-adapter";
     *
     * new Serde(new NoOpSerdeAdapter())
     * ```
     */
    serde?: OneOrMore<ISerdeRegister>;

    /**
     * The serde transformer name used to identify file storage serializers and deserializers when there are adapters with the same name.
     *
     * The adapter's constructor name is appended to this value, or used on its own when omitted.
     * @default
     * ```ts
     * getConstructorName(adapter)
     * ```
     */
    serdeTransformerName?: string;
};

/**
 * IMPORT_PATH: `"eridu-tech/file-storage"`
 * @group Derivables
 */
export type FileStorageSettings = FileStorageSettingsBase & {
    /**
     * The underlying storage adapter that handles the actual file operations.
     */
    adapter: ISignedFileStorageAdapter;
};

/**
 * `FileStorage` class can be derived from any {@link ISignedFileStorageAdapter | `ISignedFileStorageAdapter`}.
 *
 * Note the {@link IFile | `IFile`} instances created by the `FileStorage` class are serializable and deserializable,
 * allowing them to be seamlessly transferred across different servers, processes, and databases.
 * This can be done directly using {@link ISerdeRegister | `ISerderRegister`} or indirectly through components that rely on {@link ISerdeRegister | `ISerderRegister`} internally.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage"`
 * @group Derivables
 */
export class FileStorage implements IFileStorage {
    private readonly adapter: ISignedFileStorageAdapter;
    private readonly serde: OneOrMore<ISerdeRegister>;
    private readonly serdeTransformerName: string;
    private readonly defaultContentDisposition: string | null;
    private readonly defaultContentEncoding: string | null;
    private readonly defaultCacheControl: string | null;
    private readonly defaultContentLanguage: string | null;

    constructor(settings: FileStorageSettings) {
        const {
            adapter,
            serde = new Serde(new NoOpSerdeAdapter()),
            serdeTransformerName,
            defaultCacheControl = null,
            defaultContentDisposition = "inline",
            defaultContentEncoding = null,
            defaultContentLanguage = null,
        } = settings;

        this.defaultContentDisposition = defaultContentDisposition;
        this.defaultContentEncoding = defaultContentEncoding;
        this.defaultCacheControl = defaultCacheControl;
        this.defaultContentLanguage = defaultContentLanguage;
        this.adapter = adapter;
        this.serde = serde;
        this.serdeTransformerName = resolveSerdeTransformerName(
            serdeTransformerName,
            adapter,
        );
        this.registerToSerde();
    }

    private registerToSerde(): void {
        const transformer = new FileSerdeTransformer({
            defaultCacheControl: this.defaultCacheControl,
            defaultContentDisposition: this.defaultContentDisposition,
            defaultContentEncoding: this.defaultContentEncoding,
            defaultContentLanguage: this.defaultContentLanguage,
            adapter: this.adapter,
            serdeTransformerName: this.serdeTransformerName,
        });
        for (const serde of resolveOneOrMore(this.serde)) {
            serde.registerCustom(transformer, CORE);
        }
    }

    create(key: string): IFile {
        return new File({
            defaultCacheControl: this.defaultCacheControl,
            defaultContentDisposition: this.defaultContentDisposition,
            defaultContentEncoding: this.defaultContentEncoding,
            defaultContentLanguage: this.defaultContentLanguage,
            adapter: this.adapter,
            key,
            originalKey: key,
            serdeTransformerName: this.serdeTransformerName,
        });
    }

    async clear(): Promise<void> {
        await this.adapter.removeByPrefix("");
    }

    async removeMany(files: Array<IFile>): Promise<boolean> {
        const keys = files.map((file) => {
            return file.key;
        });
        return await this.adapter.removeMany(keys);
    }
}
