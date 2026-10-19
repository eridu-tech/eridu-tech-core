/**
 * @module FileStorage
 */

import { MergedFileUrlAdapter } from "@/file-storage/implementations/adapters/signed-file-storage-adapter/merged-file-url-adapter.js";

import type {
    FileAdapterSignedDownloadUrlSettings,
    FileAdapterSignedUploadUrlSettings,
    FileAdapterMetadata,
    FileAdapterStream,
    IFileStorageAdapter,
    IFileUrlAdapter,
    ISignedFileStorageAdapter,
    WritableFileAdapterContent,
    WritableFileAdapterStream,
} from "@/file-storage/contracts/_module-exports.js";

/**
 * Configuration for `SignedFileStorageAdapter`.
 * Combines a regular file storage adapter with a URL adapter to provide a complete signed file storage adapter.
 * The `adapter` handles all file CRUD operations while the `urlAdapter` handles public and signed URL generation.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/signed-file-storage-adapter"`
 * @group Adapters
 */
export type SignedFileStorageAdapterSettings = {
    /**
     * The underlying file storage adapter that handles file operations such as create, read, update, delete, copy and move.
     * This adapter is not required to implement signed URL generation, which is handled by the `urlAdapter`.
     */
    adapter: IFileStorageAdapter;

    /**
     * Partial URL adapter for generating public and signed URLs.
     * Only the URL methods your storage backend supports need to be provided.
     * Any omitted method falls back to a no-op implementation:
     * - `getPublicUrl` returns `null`
     * - `getSignedDownloadUrl` returns `null`
     * - `getSignedUploadUrl` returns an empty string
     */
    urlAdapter: Partial<IFileUrlAdapter>;
};

/**
 * Adapter that merges a {@link IFileStorageAdapter | `IFileStorageAdapter`} (file CRUD operations) and an
 * {@link IFileUrlAdapter | `IFileUrlAdapter`} (URL generation) into a single
 * {@link ISignedFileStorageAdapter | `ISignedFileStorageAdapter`}.
 *
 * Useful for storage backends where file operations and signed URL generation are handled separately,
 * for example a database-backed storage adapter combined with an S3 URL adapter.
 * All file CRUD methods are delegated to the underlying `adapter`, while URL methods are delegated
 * to the `urlAdapter`, falling back to a no-op implementation for any method that is not provided.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/signed-file-storage-adapter"`
 * @group Adapters
 */
export class SignedFileStorageAdapter implements ISignedFileStorageAdapter {
    private readonly urlAdapter: IFileUrlAdapter;
    private readonly adapter: IFileStorageAdapter;

    /**
     * @param settings - Configuration providing the underlying file storage adapter and the URL adapter.
     */
    constructor(settings: SignedFileStorageAdapterSettings) {
        const { adapter, urlAdapter: urlAdapter } = settings;
        this.adapter = adapter;
        this.urlAdapter = new MergedFileUrlAdapter(urlAdapter);
    }
    put(key: string, content: WritableFileAdapterContent): Promise<void> {
        return this.adapter.put(key, content);
    }

    putStream(key: string, stream: WritableFileAdapterStream): Promise<void> {
        return this.adapter.putStream(key, stream);
    }

    copy(source: string, destination: string): Promise<boolean> {
        return this.adapter.copy(source, destination);
    }

    move(source: string, destination: string): Promise<boolean> {
        return this.adapter.move(source, destination);
    }

    removeMany(keys: Array<string>): Promise<void> {
        return this.adapter.removeMany(keys);
    }

    removeByPrefix(prefix: string): Promise<void> {
        return this.adapter.removeByPrefix(prefix);
    }

    getPublicUrl(key: string): Promise<string> {
        return this.urlAdapter.getPublicUrl(key);
    }

    getSignedDownloadUrl(
        key: string,
        settings: FileAdapterSignedDownloadUrlSettings,
    ): Promise<string> {
        return this.urlAdapter.getSignedDownloadUrl(key, settings);
    }

    getSignedUploadUrl(
        key: string,
        settings: FileAdapterSignedUploadUrlSettings,
    ): Promise<string> {
        return this.urlAdapter.getSignedUploadUrl(key, settings);
    }

    exists(key: string): Promise<boolean> {
        return this.adapter.exists(key);
    }

    getStream(key: string): Promise<FileAdapterStream | null> {
        return this.adapter.getStream(key);
    }

    getBytes(key: string): Promise<Uint8Array | null> {
        return this.adapter.getBytes(key);
    }

    getMetaData(key: string): Promise<FileAdapterMetadata | null> {
        return this.adapter.getMetaData(key);
    }
}
