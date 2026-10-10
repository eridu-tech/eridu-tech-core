/**
 * @module FileStorage
 */

import {
    File,
    FILE_CLASS_TAG,
} from "@/file-storage/implementations/derivables/file-storage/file.js";
import {
    getConstructorName,
    isInternalSerdeIdentifiable,
} from "@/utilities/_module-exports.js";

import type {
    IFile,
    ISignedFileStorageAdapter,
} from "@/file-storage/contracts/_module-exports.js";
import type { ISerializedFile } from "@/file-storage/implementations/derivables/file-storage/file.js";
import type { ISerdeTransformer } from "@/serde/contracts/_module-exports.js";
import type { OneOrMore } from "@/utilities/_module-exports.js";

/**
 * @internal
 */
export type FileSerdeTransformerSettings = {
    defaultContentDisposition: string | null;
    defaultContentEncoding: string | null;
    defaultCacheControl: string | null;
    defaultContentLanguage: string | null;
    adapter: ISignedFileStorageAdapter;
    serializationId?: string;
};

/**
 * @internal
 */
export class FileSerdeTransformer implements ISerdeTransformer<
    IFile,
    ISerializedFile
> {
    private readonly adapter: ISignedFileStorageAdapter;
    private readonly serializationId: string;
    private readonly defaultContentDisposition: string | null;
    private readonly defaultContentEncoding: string | null;
    private readonly defaultCacheControl: string | null;
    private readonly defaultContentLanguage: string | null;

    constructor(settings: FileSerdeTransformerSettings) {
        const {
            adapter,
            serializationId,
            defaultCacheControl,
            defaultContentDisposition,
            defaultContentEncoding,
            defaultContentLanguage,
        } = settings;

        this.adapter = adapter;
        this.serializationId = serializationId ?? "";
        this.defaultCacheControl = defaultCacheControl;
        this.defaultContentDisposition = defaultContentDisposition;
        this.defaultContentEncoding = defaultContentEncoding;
        this.defaultContentLanguage = defaultContentLanguage;
    }

    get name(): OneOrMore<string> {
        return [
            "file",
            this.serializationId,
            getConstructorName(this.adapter),
        ].filter((str) => str !== "");
    }

    async isApplicable(value: unknown): Promise<boolean> {
        if (!isInternalSerdeIdentifiable(value)) {
            return false;
        }
        if (value.internalClassTag() !== FILE_CLASS_TAG) {
            return false;
        }

        const isSerlizationIdMathcing =
            this.serializationId === (await value.internalSerializationId());

        return isSerlizationIdMathcing;
    }

    deserialize(serializedValue: ISerializedFile): File {
        const { key } = serializedValue;

        return new File({
            originalKey: key,
            defaultCacheControl: this.defaultCacheControl,
            defaultContentDisposition: this.defaultContentDisposition,
            defaultContentEncoding: this.defaultContentEncoding,
            defaultContentLanguage: this.defaultContentLanguage,
            adapter: this.adapter,
            key,
            serializationId: this.serializationId,
        });
    }

    serialize(deserializedValue: File): ISerializedFile {
        return File.internalSerialize(deserializedValue);
    }
}
