/**
 * @module FileStorage
 */

import type {
    ISignedFileStorageAdapter,
    FileAdapterMetadata,
    FileAdapterStream,
    WritableFileAdapterContent,
    WritableFileAdapterStream,
    FileAdapterSignedDownloadUrlSettings,
    FileAdapterSignedUploadUrlSettings,
} from "@/file-storage/contracts/_module-exports.js";

/**
 * The `NoOpFileStorageAdapter` will do nothing and is used for easily mocking {@link ISignedFileStorageAdapter | `ISignedFileStorageAdapter`} for testing.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/no-op-file-storage-adapter"`
 * @group Adapters
 */
export class NoOpFileStorageAdapter implements ISignedFileStorageAdapter {
    getPublicUrl(_key: string): Promise<string> {
        return Promise.resolve("");
    }

    getSignedDownloadUrl(
        _key: string,
        _settings: FileAdapterSignedDownloadUrlSettings,
    ): Promise<string> {
        return Promise.resolve("");
    }

    getSignedUploadUrl(
        _key: string,
        _settings: FileAdapterSignedUploadUrlSettings,
    ): Promise<string> {
        return Promise.resolve("");
    }

    exists(_key: string): Promise<boolean> {
        return Promise.resolve(false);
    }

    getStream(_key: string): Promise<FileAdapterStream | null> {
        return Promise.resolve(null);
    }

    getBytes(_key: string): Promise<Uint8Array | null> {
        return Promise.resolve(null);
    }

    getMetaData(_key: string): Promise<FileAdapterMetadata | null> {
        return Promise.resolve(null);
    }

    put(_key: string, _content: WritableFileAdapterContent): Promise<void> {
        return Promise.resolve();
    }

    putStream(_key: string, _stream: WritableFileAdapterStream): Promise<void> {
        return Promise.resolve();
    }

    copy(_source: string, _destination: string): Promise<boolean> {
        return Promise.resolve(true);
    }

    move(_source: string, _destination: string): Promise<boolean> {
        return Promise.resolve(true);
    }

    removeMany(_keys: Array<string>): Promise<void> {
        return Promise.resolve();
    }

    removeByPrefix(_prefix: string): Promise<void> {
        return Promise.resolve();
    }
}
