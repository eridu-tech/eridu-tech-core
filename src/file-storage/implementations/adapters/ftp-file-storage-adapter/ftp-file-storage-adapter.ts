/**
 * @module FileStorage
 */

import * as posix from "node:path/posix";
import * as win32 from "node:path/win32";
import { finished, PassThrough, Readable } from "node:stream";

import { FileType, FTPError } from "basic-ftp";
import etag from "etag";

import { Base64UrlCodec } from "@/codec/implementations/base-64-url-codec/_module-exports.js";
import { FsKeyPathMapper } from "@/file-storage/implementations/adapters/_shared/_module.js";
import { UnexpectedError } from "@/utilities/_module-exports.js";

import type { Client } from "basic-ftp";

import type { ICodec } from "@/codec/contracts/_module-exports.js";
import type {
    FileAdapterMetadata,
    FileAdapterStream,
    IFileStorageAdapter,
    WritableFileAdapterContent,
    WritableFileAdapterStream,
} from "@/file-storage/contracts/_module-exports.js";
import type { IGenericPoolBase } from "@/generic-pool/contracts/_module-exports.js";

/**
 * IMPORT_PATH: `"eridu-tech/file-storage/Ftp-file-storage-adapter"`
 * @group Adapters
 */
export const PATH_TYPE = {
    POSIX: "posix",
    WIN_32: "win32",
} as const;

/**
 * IMPORT_PATH: `"eridu-tech/file-storage/Ftp-file-storage-adapter"`
 * @group Adapters
 */
export type PathType = (typeof PATH_TYPE)[keyof typeof PATH_TYPE];

/**
 * Configuration for `FtpFileStorageAdapter`.
 * Provides local filesystem-based file storage.
 *
 * IMPORT_PATH: `"eridu-tech/file-storage/Ftp-file-storage-adapter"`
 * @group Adapters
 */
export type FtpFileStorageAdapterSettings = {
    pool: IGenericPoolBase<Client>;

    /**
     * @default
     * ```ts
     * import {PATH_TYPE} from "eridu-tech/file-storage/Ftp-file-storage-adapter";
     *
     * PATH_TYPE.POSIX
     * ```
     */
    pathType?: PathType;

    /**
     * Writable root directory within the Ftp user's chroot.
     *
     * Paths are always built with POSIX semantics, regardless of the host OS.
     * Use forward slashes for Windows Ftp servers as well (`"/C:/upload"`).
     *
     * @default "/"
     */
    location?: string;

    /**
     * Character that splits a key into segments (`"a/b"` → `"a"`, `"b"`).
     * Each segment becomes a folder, so long keys avoid the file name length
     * limit.
     *
     * @default "/"
     */
    delimiter?: string;

    /**
     * Codec that encodes each key segment into a safe file name and back. The
     * default base64url allows characters like `":"` or `"*"` and stops keys
     * such as `"../secret"` from escaping the root folder.
     *
     * @default
     * ```ts
     * new Base64UrlCodec()
     * ```
     */
    codec?: ICodec<string, string>;
};

/**
 * @internal
 */
class ToBufferStream implements AsyncIterable<Buffer> {
    constructor(private readonly data: AsyncIterable<Uint8Array>) {}

    async *[Symbol.asyncIterator](): AsyncIterator<Buffer> {
        for await (const chunk of this.data) {
            yield Buffer.from(chunk);
        }
    }
}

/**
 * @internal
 */
class ToUint8ArrayStream implements AsyncIterable<Uint8Array> {
    constructor(private readonly data: AsyncIterable<Buffer>) {}

    async *[Symbol.asyncIterator](): AsyncIterator<Uint8Array> {
        for await (const chunk of this.data) {
            yield new Uint8Array(chunk);
        }
    }
}

/**
 * @internal
 */
class FtpRecursiveFileWalker implements AsyncIterable<string> {
    constructor(
        private readonly client: Client,
        private readonly path: string,
        private readonly join: (...paths: Array<string>) => string,
        private readonly normalize: (path_: string) => string,
    ) {}

    async *[Symbol.asyncIterator](): AsyncIterator<string> {
        const results = await this.client.list(this.path);
        for (const result of results) {
            const isDirectory = result.type === FileType.Directory;
            const path = this.join(this.path, result.name);
            if (isDirectory) {
                yield* new FtpRecursiveFileWalker(
                    this.client,
                    this.normalize(path),
                    this.join,
                    this.normalize,
                );
            } else {
                yield path;
            }
        }
    }
}

/**
 * IMPORT_PATH: `"eridu-tech/file-storage/Ftp-file-storage-adapter"`
 * @group Adapters
 */
export class FtpFileStorageAdapter implements IFileStorageAdapter {
    private readonly keyPathMapper: FsKeyPathMapper;
    private readonly location: string;
    private readonly pathType: PathType;
    private readonly pool: IGenericPoolBase<Client>;

    constructor(settings: FtpFileStorageAdapterSettings) {
        const {
            pool,
            codec = new Base64UrlCodec(),
            delimiter = "/",
            location = "/",
            pathType = PATH_TYPE.POSIX,
        } = settings;
        this.keyPathMapper = new FsKeyPathMapper(delimiter, codec);
        this.pathType = pathType;
        this.location = location;
        this.pool = pool;
    }

    private normalize(path: string): string {
        if (this.pathType === "posix") {
            return posix.normalize(path);
        }
        return win32.normalize(path);
    }

    private resolve(...paths: Array<string>): string {
        if (this.pathType === "posix") {
            return posix.resolve(...paths);
        }
        return win32.resolve(...paths);
    }

    private join(...paths: Array<string>): string {
        if (this.pathType === "posix") {
            return posix.join(...paths);
        }
        return win32.join(...paths);
    }

    private toPath(key: string): string {
        return this.normalize(
            this.join(
                this.resolve("/", this.location),
                this.keyPathMapper.toPath(key),
            ),
        );
    }

    private toDirectoryPath(key: string): string {
        return this.normalize(
            this.join(
                this.resolve("/", this.location),
                this.keyPathMapper.toDirectoryPath(key),
            ),
        );
    }
    private async _exists(client: Client, key: string): Promise<boolean> {
        try {
            const path = this.toPath(key);
            await client.size(path);
            return true;
        } catch (error: unknown) {
            const isNotFoundError =
                error instanceof FTPError && error.code === 550;

            if (isNotFoundError) {
                return false;
            }
            throw error;
        }
    }

    async exists(key: string): Promise<boolean> {
        return await this.pool.run(async (client) => {
            return this._exists(client, key);
        });
    }

    async getStream(key: string): Promise<FileAdapterStream | null> {
        const client = await this.pool.acquireOrFail();

        let isNotFound: boolean;
        try {
            const isFound = await this._exists(client, key);
            isNotFound = !isFound;
        } catch (error: unknown) {
            await this.pool.release(client);
            throw error;
        }

        if (isNotFound) {
            await this.pool.release(client);
            return null;
        }

        const path = this.toPath(key);
        const stream = new PassThrough();
        void client.downloadTo(stream, path);
        const cleanup = finished(stream, () => {
            cleanup();
            void this.pool.release(client);
        });
        return new ToUint8ArrayStream(stream);
    }

    async getBytes(key: string): Promise<Uint8Array | null> {
        return await this.pool.run(async (client) => {
            try {
                const path = this.toPath(key);
                const chunks: Array<any> = [];
                const stream = new PassThrough();
                const responsePromise = client.downloadTo(stream, path);

                for await (const chunk of stream) {
                    if (!(chunk instanceof Buffer)) {
                        continue;
                    }
                    chunks.push(chunk);
                }
                await responsePromise;

                return new Uint8Array(Buffer.concat(chunks));
            } catch (error: unknown) {
                const isNotFoundError =
                    error instanceof FTPError && error.code === 550;
                if (isNotFoundError) {
                    return null;
                }
                throw error;
            }
        });
    }

    private static toStats(
        fileSizeInBytes: number,
        updatedAt: Date,
    ): etag.StatsLike {
        if (!Number.isFinite(fileSizeInBytes) || fileSizeInBytes < 0) {
            throw UnexpectedError.create(
                `SFTP stat size is invalid: ${String(fileSizeInBytes)}`,
            );
        }

        return {
            ctime: updatedAt,
            mtime: updatedAt,
            ino: 0,
            size: fileSizeInBytes,
        };
    }

    private static toFileMetadata(stat: etag.StatsLike): FileAdapterMetadata {
        return {
            etag: etag(stat),
            contentType: null,
            fileSizeInBytes: stat.size,
            updatedAt: stat.mtime,
        };
    }

    async getMetaData(key: string): Promise<FileAdapterMetadata | null> {
        return await this.pool.run(async (client) => {
            try {
                const path = this.toPath(key);
                const fileSizeInBytes = await client.size(path);
                const updatedAt = await client.lastMod(path);
                const stats = FtpFileStorageAdapter.toStats(
                    fileSizeInBytes,
                    updatedAt,
                );
                return FtpFileStorageAdapter.toFileMetadata(stats);
            } catch (error: unknown) {
                const isFileNotFoundError =
                    error instanceof FTPError && error.code === 550;
                if (isFileNotFoundError) {
                    return null;
                }
                throw error;
            }
        });
    }

    async put(key: string, content: WritableFileAdapterContent): Promise<void> {
        await this.pool.run(async (client) => {
            const path = this.toPath(key);
            const directoryPath = this.toDirectoryPath(key);
            await client.ensureDir(directoryPath);
            await client.uploadFrom(
                Readable.from(Buffer.from(content.data)),
                path,
            );
        });
    }

    async putStream(
        key: string,
        stream: WritableFileAdapterStream,
    ): Promise<void> {
        await this.pool.run(async (client) => {
            const path = this.toPath(key);
            const directoryPath = this.toDirectoryPath(key);
            await client.ensureDir(directoryPath);
            await client.uploadFrom(
                Readable.from(new ToBufferStream(stream.data)),
                path,
            );
        });
    }

    private async _copy(source: string, destination: string): Promise<boolean> {
        const bridge = new PassThrough();

        const sourcePath = this.toPath(source);
        const destinationPath = this.toPath(destination);
        const destinationDirectoryPath = this.toDirectoryPath(destination);

        await this.pool.run(async (client) => {
            await client.ensureDir(destinationDirectoryPath);
        });
        const downloadPromise = this.pool.run((client) => {
            return client.downloadTo(bridge, sourcePath);
        });
        const uploadPromise = this.pool.run((client) => {
            return client.uploadFrom(bridge, destinationPath);
        });

        try {
            await Promise.all([downloadPromise, uploadPromise]);
        } catch (error: unknown) {
            const isNotFoundError =
                error instanceof FTPError && error.code === 550;
            if (isNotFoundError) {
                return false;
            }
            throw error;
        }
        return true;
    }

    async copy(source: string, destination: string): Promise<boolean> {
        return this._copy(source, destination);
    }

    // Removes sequentially, one at a time
    private async _removeMany(
        client: Client,
        keys: Array<string>,
    ): Promise<void> {
        const paths = new Set(
            keys.map((key) => {
                return this.toPath(key);
            }),
        );
        for (const path of paths) {
            try {
                await client.remove(path);
            } catch (error: unknown) {
                const isFileNotFound =
                    error instanceof FTPError && error.code === 550;
                if (isFileNotFound) {
                    continue;
                }
                throw error;
            }
        }
    }

    async move(source: string, destination: string): Promise<boolean> {
        const hasCopied = await this._copy(source, destination);
        if (hasCopied) {
            await this.pool.run(async (client) => {
                await this._removeMany(client, [source]);
            });
        }
        return hasCopied;
    }

    // Removes in parallel, multiple at a time
    async removeMany(keys: Array<string>): Promise<void> {
        const promises = keys.map((key) => {
            return this.pool.run(async (client) => {
                await this._removeMany(client, [key]);
            });
        });
        await Promise.all(promises);
    }

    async removeByPrefix(prefix: string): Promise<void> {
        await this.pool.run(async (client) => {
            const fileWalker = new FtpRecursiveFileWalker(
                client,
                this.resolve("/", this.location),
                (...args) => this.join(...args),
                (...args) => this.normalize(...args),
            );

            for await (const path of fileWalker) {
                if (
                    !this.keyPathMapper
                        .fromPath(
                            // On windows they left slashes \\, this.keyPathMapper.fromPath method expects left slashes
                            path.replaceAll(/\\/g, "/"),
                        )
                        .startsWith(this.join(this.location, prefix))
                ) {
                    continue;
                }

                try {
                    await client.remove(path);
                } catch (error: unknown) {
                    const isFileNotFound =
                        error instanceof Error &&
                        error.message.startsWith("delete: No such file");
                    if (isFileNotFound) {
                        continue;
                    }
                    throw error;
                }
            }
        });
    }
}
