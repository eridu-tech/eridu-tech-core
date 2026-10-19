/**
 * @module FileStorage
 */

import { Buffer } from "node:buffer";

import etag from "etag";

import type {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    IFileStorage,
    IFileStorageAdapter,
    FileAdapterMetadata,
    FileAdapterStream,
    WritableFileAdapterContent,
    WritableFileAdapterStream,
} from "@/file-storage/contracts/_module-exports.js";
import type { IDeinitizable } from "@/utilities/_module-exports.js";

/**
 * IMPORT_PATH: `"eridu-tech/file-storage/memory-file-storage-adapter"`
 * @group Adapters
 */
export type MemoryFile = {
    data: Buffer;
    metadata: {
        etag: string;
        contentType: string;
        updatedAt: Date;
    };
};

/**
 * The `MemoryFileStorageAdapter` is used for easily facking {@link IFileStorage | `IFileStorage`} for testing.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/memory-file-storage-adapter"`
 * @group Adapters
 */
export class MemoryFileStorageAdapter
    implements IFileStorageAdapter, IDeinitizable
{
    /**
     * You can provide an optional {@link Map | `Map`}, that will be used for storing the data.
     */
    constructor(private readonly map = new Map<string, MemoryFile>()) {}

    /**
     * Removes all in-memory file data.
     */
    deInit(): Promise<void> {
        this.map.clear();
        return Promise.resolve();
    }

    exists(key: string): Promise<boolean> {
        return Promise.resolve(this.map.has(key));
    }

    getStream(key: string): Promise<FileAdapterStream | null> {
        const file = this.map.get(key);
        if (file === undefined) {
            return Promise.resolve(null);
        }
        return Promise.resolve({
            async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
                yield Promise.resolve(new Uint8Array(file.data));
            },
        } satisfies FileAdapterStream);
    }

    getBytes(key: string): Promise<Uint8Array | null> {
        const file = this.map.get(key);
        if (file === undefined) {
            return Promise.resolve(null);
        }
        return Promise.resolve(new Uint8Array(file.data));
    }

    getMetaData(key: string): Promise<FileAdapterMetadata | null> {
        const file = this.map.get(key);
        if (file === undefined) {
            return Promise.resolve(null);
        }
        return Promise.resolve(
            structuredClone({
                etag: file.metadata.etag,
                contentType: file.metadata.contentType,
                fileSizeInBytes: file.data.length,
                updatedAt: file.metadata.updatedAt,
            }) satisfies FileAdapterMetadata,
        );
    }

    add(key: string, content: WritableFileAdapterContent): Promise<boolean> {
        if (this.map.has(key)) {
            return Promise.resolve(false);
        }
        const contentData = Buffer.from(content.data);
        const copiedBuffer = Buffer.alloc(contentData.byteLength);
        contentData.copy(copiedBuffer);
        this.map.set(key, {
            data: copiedBuffer,
            metadata: {
                etag: etag(copiedBuffer),
                contentType: content.contentType,
                updatedAt: new Date(),
            },
        });
        return Promise.resolve(true);
    }

    async addStream(
        key: string,
        stream: WritableFileAdapterStream,
    ): Promise<boolean> {
        if (this.map.has(key)) {
            return Promise.resolve(false);
        }
        let totalData = Buffer.from([]);
        for await (const chunk of stream.data) {
            totalData = Buffer.concat([totalData, chunk]);
        }
        this.map.set(key, {
            data: totalData,
            metadata: {
                etag: etag(totalData),
                contentType: stream.contentType,
                updatedAt: new Date(),
            },
        });
        return Promise.resolve(true);
    }

    update(key: string, content: WritableFileAdapterContent): Promise<boolean> {
        let file = this.map.get(key);
        if (file === undefined) {
            return Promise.resolve(false);
        }

        const contentData = Buffer.from(content.data);
        const copiedBuffer = Buffer.alloc(contentData.byteLength);
        contentData.copy(copiedBuffer);
        file = {
            data: copiedBuffer,
            metadata: {
                etag: etag(copiedBuffer),
                contentType: content.contentType,
                updatedAt: new Date(),
            },
        };
        this.map.set(key, file);
        return Promise.resolve(true);
    }

    async updateStream(
        key: string,
        stream: WritableFileAdapterStream,
    ): Promise<boolean> {
        let file = this.map.get(key);
        if (file === undefined) {
            return Promise.resolve(false);
        }
        let totalData = Buffer.from([]);
        for await (const chunk of stream.data) {
            totalData = Buffer.concat([totalData, chunk]);
        }
        file = {
            data: totalData,
            metadata: {
                etag: etag(totalData),
                contentType: stream.contentType,
                updatedAt: new Date(),
            },
        };
        this.map.set(key, file);
        return Promise.resolve(true);
    }

    put(key: string, content: WritableFileAdapterContent): Promise<void> {
        const contentData = Buffer.from(content.data);
        const copiedBuffer = Buffer.alloc(contentData.byteLength);
        contentData.copy(copiedBuffer);
        this.map.set(key, {
            data: copiedBuffer,
            metadata: {
                etag: etag(copiedBuffer),
                contentType: content.contentType,
                updatedAt: new Date(),
            },
        });
        return Promise.resolve();
    }

    async putStream(
        key: string,
        stream: WritableFileAdapterStream,
    ): Promise<void> {
        let totalData = Buffer.from([]);
        for await (const chunk of stream.data) {
            totalData = Buffer.concat([totalData, chunk]);
        }
        this.map.set(key, {
            data: totalData,
            metadata: {
                etag: etag(totalData),
                contentType: stream.contentType,
                updatedAt: new Date(),
            },
        });
        return Promise.resolve();
    }

    private internalCopyAndReplace(
        source: string,
        destination: string,
    ): boolean {
        const sourceFile = this.map.get(source);
        if (sourceFile === undefined) {
            return false;
        }
        const copiedBuffer = Buffer.alloc(sourceFile.data.byteLength);
        sourceFile.data.copy(copiedBuffer);
        this.map.set(destination, {
            data: copiedBuffer,
            metadata: structuredClone(sourceFile.metadata),
        });
        return true;
    }

    async copy(source: string, destination: string): Promise<boolean> {
        return Promise.resolve(
            this.internalCopyAndReplace(source, destination),
        );
    }

    private internalRemoveMany(keys: Array<string>): void {
        for (const key of keys) {
            this.map.delete(key);
        }
    }

    async move(source: string, destination: string): Promise<boolean> {
        const hasMoved = this.internalCopyAndReplace(source, destination);
        if (hasMoved) {
            this.internalRemoveMany([source]);
        }
        return Promise.resolve(hasMoved);
    }

    async removeMany(keys: Array<string>): Promise<void> {
        this.internalRemoveMany(keys);
        return Promise.resolve();
    }

    removeByPrefix(prefix: string): Promise<void> {
        for (const [key] of this.map) {
            if (!key.startsWith(prefix)) {
                continue;
            }
            this.map.delete(key);
        }
        return Promise.resolve();
    }
}
