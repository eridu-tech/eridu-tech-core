/**
 * @module FileStorage
 */

import { FILE_CLASS_TAG } from "@/file-storage/implementations/derivables/file-storage/file.js";
import {
    isInternalSerdeIdentifiable,
    UnexpectedError,
} from "@/utilities/_module-exports.js";

import type {
    DiToken,
    IServiceResolver,
} from "@/di/contracts/_module-exports.js";
import type {
    FileDownloadUrlOptions,
    FileMetadata,
    FileUploadUrlOptions,
    IFile,
    IFileStorageResolver,
    WritableFileContent,
    WritableFileStream,
} from "@/file-storage/contracts/_module-exports.js";

/**
 * @internal
 */
export class ProxyFile<TAdapters extends string = string> implements IFile {
    private file: IFile | null = null;

    constructor(
        private readonly container: Pick<IServiceResolver, "resolveOrFail">,
        private readonly resolverToken: DiToken<
            IFileStorageResolver<TAdapters>
        >,
        private readonly adapterName: TAdapters | undefined,
        private readonly resourceKey: string,
    ) {}

    private getFile(): IFile {
        const fileStorageResolver = this.container.resolveOrFail(
            this.resolverToken,
        );
        if (this.file === null) {
            this.file = fileStorageResolver
                .use(this.adapterName)
                .create(this.resourceKey);
        }
        return this.file;
    }

    internalClassTag(): symbol {
        return FILE_CLASS_TAG;
    }

    async internalSerializationId(): Promise<string> {
        const file = this.getFile();
        if (!isInternalSerdeIdentifiable(file)) {
            throw UnexpectedError.create(
                "Cannot serialize the resolved file, it does not implement internal serialization",
            );
        }
        return await file.internalSerializationId();
    }

    get key(): string {
        return this.resourceKey;
    }

    async getText(): Promise<string | null> {
        return this.getFile().getText();
    }

    async getTextOrFail(): Promise<string> {
        return this.getFile().getTextOrFail();
    }

    async getBytes(): Promise<Uint8Array | null> {
        return this.getFile().getBytes();
    }

    async getBytesOrFail(): Promise<Uint8Array> {
        return this.getFile().getBytesOrFail();
    }

    async getArrayBuffer(): Promise<ArrayBuffer | null> {
        return this.getFile().getArrayBuffer();
    }

    async getArrayBufferOrFail(): Promise<ArrayBuffer> {
        return this.getFile().getArrayBufferOrFail();
    }

    async getReadableStream(): Promise<ReadableStream<Uint8Array> | null> {
        return this.getFile().getReadableStream();
    }

    async getReadableStreamOrFail(): Promise<ReadableStream<Uint8Array>> {
        return this.getFile().getReadableStreamOrFail();
    }

    async getMetadata(): Promise<FileMetadata | null> {
        return this.getFile().getMetadata();
    }

    async getMetadataOrFail(): Promise<FileMetadata> {
        return this.getFile().getMetadataOrFail();
    }

    async exists(): Promise<boolean> {
        return this.getFile().exists();
    }

    async missing(): Promise<boolean> {
        return this.getFile().missing();
    }

    async getPublicUrl(): Promise<string> {
        return this.getFile().getPublicUrl();
    }

    async getSignedDownloadUrl(
        options?: FileDownloadUrlOptions,
    ): Promise<string> {
        return this.getFile().getSignedDownloadUrl(options);
    }

    async put(content: WritableFileContent): Promise<void> {
        return this.getFile().put(content);
    }

    async putStream(stream: WritableFileStream): Promise<void> {
        return this.getFile().putStream(stream);
    }

    async remove(): Promise<void> {
        return this.getFile().remove();
    }

    async copy(destination: string): Promise<boolean> {
        return this.getFile().copy(destination);
    }

    async copyOrFail(destination: string): Promise<void> {
        return this.getFile().copyOrFail(destination);
    }

    async move(destination: string): Promise<boolean> {
        return this.getFile().move(destination);
    }

    async moveOrFail(destination: string): Promise<void> {
        return this.getFile().moveOrFail(destination);
    }

    async getSignedUploadUrl(options?: FileUploadUrlOptions): Promise<string> {
        return this.getFile().getSignedUploadUrl(options);
    }
}
