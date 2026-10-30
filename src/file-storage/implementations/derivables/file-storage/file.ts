/**
 * @module FileStorage
 */

import { TO_BYTES } from "@/file-size/contracts/_module-exports.js";
import { FileSize } from "@/file-size/implementations/_module-exports.js";
import { KeyNotFoundFileError } from "@/file-storage/contracts/_module-exports.js";
import { resolveFileContent } from "@/file-storage/implementations/derivables/file-storage/resolve-file-content.js";
import { ResolveFileStream } from "@/file-storage/implementations/derivables/file-storage/resolve-file-stream.js";
import { TimeSpan } from "@/time-span/implementations/_module-exports.js";

import type {
    IFile,
    ISignedFileStorageAdapter,
    FileMetadata,
    WritableFileStream,
    FileDownloadUrlOptions,
    WritableFileContent,
    FileUploadUrlOptions,
} from "@/file-storage/contracts/_module-exports.js";
import type {
    Bytes,
    InternalSerdeIdentifiable,
} from "@/utilities/_module-exports.js";

/**
 * @internal
 */
export type FileSettings = {
    originalKey: string;
    adapter: ISignedFileStorageAdapter;
    key: string;
    serializationId?: string;
    defaultContentDisposition: string | null;
    defaultContentEncoding: string | null;
    defaultCacheControl: string | null;
    defaultContentLanguage: string | null;
};

/**
 * @internal
 */
export type ISerializedFile = {
    version: "1";
    key: string;
};

/**
 * @internal
 */
export const FILE_CLASS_TAG = Symbol("File");

/**
 * @internal
 */
export class File implements IFile, InternalSerdeIdentifiable {
    /**
     * @internal
     */
    static internalSerialize(deserializedValue: IFile): ISerializedFile {
        return {
            version: "1",
            key: deserializedValue.key,
        };
    }

    private static readonly DEFAULT_CONTENT_TYPE = "application/octet-stream";

    private readonly adapter: ISignedFileStorageAdapter;
    private readonly internalKey: string;
    private readonly serializationId: string;
    private readonly defaultContentDisposition: string | null;
    private readonly defaultContentEncoding: string | null;
    private readonly defaultCacheControl: string | null;
    private readonly defaultContentLanguage: string | null;

    constructor(settings: FileSettings) {
        const {
            adapter,
            key,
            serializationId,
            defaultContentDisposition,
            defaultContentEncoding,
            defaultCacheControl,
            defaultContentLanguage,
        } = settings;

        this.adapter = adapter;
        this.internalKey = key;
        this.serializationId = serializationId ?? "";
        this.defaultContentDisposition = defaultContentDisposition;
        this.defaultContentEncoding = defaultContentEncoding;
        this.defaultCacheControl = defaultCacheControl;
        this.defaultContentLanguage = defaultContentLanguage;
    }

    internalClassTag(): symbol {
        return FILE_CLASS_TAG;
    }

    internalSerializationId(): string {
        return this.serializationId;
    }

    async getText(): Promise<string | null> {
        const bytes = await this.getBytes();
        if (bytes === null) {
            return null;
        }
        return new TextDecoder().decode(bytes);
    }

    async getTextOrFail(): Promise<string> {
        const text = await this.getText();
        if (text === null) {
            throw KeyNotFoundFileError.create(this.internalKey);
        }
        return text;
    }

    async getBytes(): Promise<Bytes | null> {
        return await this.adapter.getBytes(this.internalKey);
    }

    async getBytesOrFail(): Promise<Bytes> {
        const bytes = await this.getBytes();
        if (bytes === null) {
            throw KeyNotFoundFileError.create(this.internalKey);
        }
        return bytes;
    }

    async getArrayBuffer(): Promise<ArrayBuffer | null> {
        const bytes = await this.getBytes();
        if (bytes === null) {
            return null;
        }
        return new Uint8Array(bytes).buffer;
    }

    async getArrayBufferOrFail(): Promise<ArrayBuffer> {
        const arrayBuffer = await this.getArrayBuffer();
        if (arrayBuffer === null) {
            throw KeyNotFoundFileError.create(this.internalKey);
        }
        return arrayBuffer;
    }

    async getReadableStream(): Promise<ReadableStream<Bytes> | null> {
        const stream = await this.adapter.getStream(this.internalKey);
        if (stream === null) {
            return null;
        }
        return ReadableStream.from(stream);
    }

    async getReadableStreamOrFail(): Promise<ReadableStream<Bytes>> {
        const stream = await this.getReadableStream();
        if (stream === null) {
            throw KeyNotFoundFileError.create(this.internalKey);
        }
        return stream;
    }

    async getMetadata(): Promise<FileMetadata | null> {
        const metadata = await this.adapter.getMetaData(this.internalKey);
        if (metadata === null) {
            return null;
        }
        return {
            contentType: metadata.contentType ?? "application/octet-stream",
            etag: metadata.etag,
            updatedAt: metadata.updatedAt,
            fileSize: FileSize.fromBytes(metadata.fileSizeInBytes),
        };
    }

    async getMetadataOrFail(): Promise<FileMetadata> {
        const metadata = await this.getMetadata();
        if (metadata === null) {
            throw KeyNotFoundFileError.create(this.internalKey);
        }
        return metadata;
    }

    async exists(): Promise<boolean> {
        return await this.adapter.exists(this.internalKey);
    }

    async missing(): Promise<boolean> {
        return !(await this.exists());
    }

    async put(content: WritableFileContent): Promise<void> {
        const { data, contentType = File.DEFAULT_CONTENT_TYPE } = content;
        const resolvedData = resolveFileContent(data);
        await this.adapter.put(this.internalKey, {
            data: resolvedData,
            contentType,
            contentDisposition: this.defaultContentDisposition,
            contentEncoding: this.defaultContentEncoding,
            cacheControl: this.defaultCacheControl,
            contentLanguage: this.defaultContentLanguage,
            fileSizeInBytes: resolvedData.length,
        });
    }

    async putStream(stream: WritableFileStream): Promise<void> {
        const {
            data,
            fileSize = null,
            contentType = File.DEFAULT_CONTENT_TYPE,
        } = stream;
        await this.adapter.putStream(this.internalKey, {
            data: new ResolveFileStream(data),
            fileSizeInBytes: fileSize?.[TO_BYTES]() ?? null,
            contentType,
            contentDisposition: this.defaultContentDisposition,
            contentEncoding: this.defaultContentEncoding,
            cacheControl: this.defaultCacheControl,
            contentLanguage: this.defaultContentLanguage,
        });
    }

    async remove(): Promise<void> {
        await this.adapter.removeMany([this.internalKey]);
    }

    async copy(destination: string): Promise<boolean> {
        return await this.adapter.copy(this.internalKey, destination);
    }

    async copyOrFail(destination: string): Promise<void> {
        const hasCopied = await this.copy(destination);
        if (!hasCopied) {
            throw KeyNotFoundFileError.create(this.internalKey);
        }
    }

    async move(destination: string): Promise<boolean> {
        return await this.adapter.move(this.internalKey, destination);
    }

    async moveOrFail(destination: string): Promise<void> {
        const hasCopied = await this.move(destination);
        if (!hasCopied) {
            throw KeyNotFoundFileError.create(this.internalKey);
        }
    }

    async getPublicUrl(): Promise<string> {
        return await this.adapter.getPublicUrl(this.internalKey);
    }

    async getSignedUploadUrl(
        options: FileUploadUrlOptions = {},
    ): Promise<string> {
        const {
            ttl = TimeSpan.fromMinutes(10),
            contentType = File.DEFAULT_CONTENT_TYPE,
        } = options;
        return await this.adapter.getSignedUploadUrl(this.internalKey, {
            expirationInSeconds: TimeSpan.fromTimeSpan(ttl).toSeconds(),
            contentType,
        });
    }

    async getSignedDownloadUrl(
        options: FileDownloadUrlOptions = {},
    ): Promise<string> {
        const {
            ttl: expiration = TimeSpan.fromMinutes(10),
            contentType = File.DEFAULT_CONTENT_TYPE,
            contentDisposition = null,
        } = options;
        return await this.adapter.getSignedDownloadUrl(this.internalKey, {
            expirationInSeconds: TimeSpan.fromTimeSpan(expiration).toSeconds(),
            contentType,
            contentDisposition,
        });
    }

    get key(): string {
        return this.internalKey;
    }
}
