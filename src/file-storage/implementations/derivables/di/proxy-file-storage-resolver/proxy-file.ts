/**
 * @module FileStorage
 */

import { FILE_CLASS_TAG } from "@/file-storage/implementations/derivables/file-storage/file.js";
import { isInternalSerdeIdentifiable } from "@/utilities/_module-exports.js";

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

    private async getFile(): Promise<IFile> {
        const fileStorageResolver = await this.container.resolveOrFail(
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
        const circuitBreaker = await this.getFile();
        if (!isInternalSerdeIdentifiable(circuitBreaker)) {
            throw new Error("!!__MESSAGE__!!");
        }
        return await circuitBreaker.internalSerializationId();
    }

    get key(): string {
        return this.resourceKey;
    }

    async getText(): Promise<string | null> {
        return (await this.getFile()).getText();
    }

    async getTextOrFail(): Promise<string> {
        return (await this.getFile()).getTextOrFail();
    }

    async getBytes(): Promise<Uint8Array | null> {
        return (await this.getFile()).getBytes();
    }

    async getBytesOrFail(): Promise<Uint8Array> {
        return (await this.getFile()).getBytesOrFail();
    }

    async getArrayBuffer(): Promise<ArrayBuffer | null> {
        return (await this.getFile()).getArrayBuffer();
    }

    async getArrayBufferOrFail(): Promise<ArrayBuffer> {
        return (await this.getFile()).getArrayBufferOrFail();
    }

    async getReadableStream(): Promise<ReadableStream<Uint8Array> | null> {
        return (await this.getFile()).getReadableStream();
    }

    async getReadableStreamOrFail(): Promise<ReadableStream<Uint8Array>> {
        return (await this.getFile()).getReadableStreamOrFail();
    }

    async getMetadata(): Promise<FileMetadata | null> {
        return (await this.getFile()).getMetadata();
    }

    async getMetadataOrFail(): Promise<FileMetadata> {
        return (await this.getFile()).getMetadataOrFail();
    }

    async exists(): Promise<boolean> {
        return (await this.getFile()).exists();
    }

    async missing(): Promise<boolean> {
        return (await this.getFile()).missing();
    }

    async getPublicUrl(): Promise<string> {
        return (await this.getFile()).getPublicUrl();
    }

    async getSignedDownloadUrl(
        options?: FileDownloadUrlOptions,
    ): Promise<string> {
        return (await this.getFile()).getSignedDownloadUrl(options);
    }

    async put(content: WritableFileContent): Promise<void> {
        return (await this.getFile()).put(content);
    }

    async putStream(stream: WritableFileStream): Promise<void> {
        return (await this.getFile()).putStream(stream);
    }

    async remove(): Promise<void> {
        return (await this.getFile()).remove();
    }

    async copy(destination: string): Promise<boolean> {
        return (await this.getFile()).copy(destination);
    }

    async copyOrFail(destination: string): Promise<void> {
        return (await this.getFile()).copyOrFail(destination);
    }

    async move(destination: string): Promise<boolean> {
        return (await this.getFile()).move(destination);
    }

    async moveOrFail(destination: string): Promise<void> {
        return (await this.getFile()).moveOrFail(destination);
    }

    async getSignedUploadUrl(options?: FileUploadUrlOptions): Promise<string> {
        return (await this.getFile()).getSignedUploadUrl(options);
    }
}
